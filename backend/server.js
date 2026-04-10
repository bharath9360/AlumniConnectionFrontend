const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const path = require('path');
const cron = require('node-cron');
const { Server } = require('socket.io');
const apicache  = require('apicache');
require('dotenv').config();

// ─── apicache: 2-min in-memory cache for GET /api/posts ──────
const cache = apicache.middleware;
// Only cache successful (2xx) responses
apicache.options({ statusCodes: { include: [200] } });

const { runGraduationJob } = require('./jobs/graduationJob');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { sanitizeBody } = require('./middleware/validate');

const app = express();
const httpServer = http.createServer(app);

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());                          // Gzip all responses — major bandwidth savings
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));
// Global sanitization — strip XSS vectors from all request bodies
app.use(sanitizeBody);

// ─── Smart Cache-Control Headers (Part 2) ─────────────────────
// Static assets (images, fonts, JS/CSS bundles) get aggressive CDN caching.
// API routes must always be validated — no stale data served to clients.
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads') || req.path.match(/\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|eot|css|js)$/i)) {
    // Immutable static assets: 1 year max-age + immutable hint
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.startsWith('/api/')) {
    // API responses: always revalidate, never serve stale
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// Serve uploads folder statically with CORS headers for cross-origin deployments (Vercel → Railway)
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ─── Socket.io Setup (Production-Ready) ──────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ["GET", "POST"]
  },
  // Transport: try WebSocket first, fall back to polling (Render/firewalls)
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,        // 60s before declaring a client dead
  pingInterval: 25000,       // heartbeat every 25s
  upgradeTimeout: 30000,     // 30s to upgrade polling → websocket
  connectTimeout: 45000,     // 45s initial connection timeout
  allowUpgrades: true,       // allow polling → websocket upgrade
  perMessageDeflate: false,  // disable compression (CPU vs bandwidth trade-off)
  httpCompression: true,
  maxHttpBufferSize: 1e6,    // 1MB max message size
  allowEIO3: true,           // backward compat with older clients
  path: '/socket.io/',
  // Origin allowlist
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5000'
    ].filter(Boolean);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ Blocked socket from unknown origin: ${origin}`);
      callback('Origin not allowed', false);
    }
  }
});

// Attach io to app so route handlers can emit events
app.set('io', io);

// ─── In-memory online user registry ──────────────────────────
// Maps socketId → userId so we can clean up on disconnect
const onlineUsers = new Map(); // socketId → userId

// Maps userId → Set of chatIds the user is actively viewing
const activeChats = new Map(); // userId → Set<chatId>

/** Returns true if userId is currently watching chatId */
const isUserActiveInChat = (userId, chatId) => {
  const rooms = activeChats.get(userId?.toString());
  return rooms ? rooms.has(chatId?.toString()) : false;
};

// Expose to route handlers via app
app.set('isUserActiveInChat', isUserActiveInChat);

/** Broadcast the current list of unique online user IDs to every client.
 *  Debounced at 500ms to prevent event spam during rapid connect/disconnect bursts. */
let broadcastTimeout;
const broadcastOnlineUsers = () => {
  clearTimeout(broadcastTimeout);
  broadcastTimeout = setTimeout(() => {
    const uniqueIds = [...new Set(onlineUsers.values())];
    io.emit('online_users', uniqueIds);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`📊 Online users: ${uniqueIds.length}`);
    }
  }, 500);
};

io.on('connection', (socket) => {

  // User establishes their identity — joins a personal room for notifications
  socket.on('setup', (userData) => {
    const uid = userData?._id || userData?.id;
    if (!uid) return;

    socket.join(uid.toString());
    socket.emit('connected');

    // Register presence
    onlineUsers.set(socket.id, uid.toString());

    // ── Instant zero-latency notification to all connected clients ──
    io.emit('user_joined', uid.toString());
    // Batch broadcast for full list sync
    broadcastOnlineUsers();
  });

  // User enters a specific chat window
  socket.on('join_chat', (room) => {
    socket.join(room);
    // Track that this user is actively viewing this chat
    const userId = onlineUsers.get(socket.id);
    if (userId && room) {
      if (!activeChats.has(userId)) activeChats.set(userId, new Set());
      activeChats.get(userId).add(room.toString());
      // Tell the server the user has read messages in this chat
      socket.to(room).emit('user_reading', { userId, chatId: room });
    }
  });

  // User leaves a chat window (navigates away)
  socket.on('leave_chat', (room) => {
    socket.leave(room);
    const userId = onlineUsers.get(socket.id);
    if (userId && room) {
      activeChats.get(userId)?.delete(room.toString());
    }
  });

  // Real-time message dispatching
  socket.on('new_message', (newMessageReceived) => {
    const chat = newMessageReceived.chatId;
    if (!chat?.participants) return;

    const senderId = (newMessageReceived.senderId?._id || newMessageReceived.senderId)?.toString();

    chat.participants.forEach((participant) => {
      const participantId = (participant._id || participant)?.toString();
      if (participantId === senderId) return; // Don't echo back to sender

      const preview = (newMessageReceived.text || '').substring(0, 60) || 'You have a new message.';
      const chatId = (chat._id || chat)?.toString();

      // Always deliver the message event
      socket.in(participantId).emit('message_received', newMessageReceived);

      // Only send notification bubble if the recipient is NOT currently viewing the chat
      const isActive = isUserActiveInChat(participantId, chatId);
      if (!isActive) {
        socket.in(participantId).emit('notification_received', {
          _id: `msg_${newMessageReceived._id || Date.now()}`,
          type: 'message',
          title: `New message from ${newMessageReceived.senderId?.name || 'Someone'}`,
          description: preview,
          isRead: false,
          createdAt: new Date().toISOString(),
          relatedId: chatId,
          chatId
        });
      }
    });
  });

  // Typing indicators
  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing'));

  // Clean up presence and active chat tracking on disconnect
  socket.on('disconnect', (reason) => {
    const userId = onlineUsers.get(socket.id);
    if (userId) {
      onlineUsers.delete(socket.id);
      // If user has no more active sockets, they are truly offline
      const stillOnline = [...onlineUsers.values()].includes(userId);
      if (!stillOnline) {
        activeChats.delete(userId);
        io.emit('user_left', userId);
      }
    }
    broadcastOnlineUsers();
    if (process.env.NODE_ENV !== 'test') {
      console.log(`❌ Socket ${socket.id} disconnected (${reason})${userId ? ` — user ${userId}` : ''}`);
    }
  });

  // Per-socket error handler
  socket.on('error', (error) => {
    console.error(`❌ Socket error (${socket.id}):`, error.message || error);
  });
});

// Engine-level transport errors (upgrade failures, bad handshakes)
io.engine.on('connection_error', (err) => {
  console.error('❌ Socket.IO engine error:', { code: err.code, message: err.message });
});

// ─── Routes (must come AFTER io is attached to app) ──────────
app.use('/api/auth',         authLimiter, require('./routes/auth'));
app.use('/api/users',        apiLimiter,  require('./routes/users'));
// Posts feed — no server-side cache; frontend sessionStorage handles instant paint.
// A 2-min server cache caused stale feed data after create/like/comment mutations.
app.use('/api/posts',        apiLimiter,  require('./routes/posts'));

app.use('/api/jobs',         apiLimiter,  require('./routes/jobs'));
app.use('/api/events',       apiLimiter,  require('./routes/events'));
app.use('/api/notifications',apiLimiter,  require('./routes/notifications'));
app.use('/api/chat',         apiLimiter,  require('./routes/chat'));
app.use('/api/connections',  apiLimiter,  require('./routes/connections'));
app.use('/api/admin',        apiLimiter,  require('./routes/admin'));
app.use('/api/admin',        apiLimiter,  require('./routes/adminAnalytics'));
app.use('/api/landing',      apiLimiter,  require('./routes/landing'));
app.use('/api/groups',       apiLimiter,  require('./routes/groups'));
app.use('/api/staff',        apiLimiter,  require('./routes/staff'));
app.use('/api/mentorship',   apiLimiter,  require('./routes/mentorship'));
app.use('/api/legal',        apiLimiter,  require('./routes/legal'));

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── Global Error Handler ─────────────────────────────────────
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ─── Database & Server Start ──────────────────────────────────
const PORT = process.env.PORT || 5000;

const isLocal = process.env.MONGO_URI?.includes('localhost') || process.env.MONGO_URI?.includes('127.0.0.1');

mongoose.connect(process.env.MONGO_URI, {
  tls: !isLocal && process.env.MONGO_URI?.startsWith('mongodb+srv'),
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,          // Force IPv4 — avoids common Windows/Atlas IPv6 TLS issues
})
  .then(() => {
    console.log('✅ MongoDB Connected');
    httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // ─── Auto Graduation Cron ─────────────────────────────────
    // Runs every day at midnight (00:00) server time
    cron.schedule('0 0 * * *', async () => {
      console.log('[Cron] ⏰ Daily graduation job triggered at', new Date().toISOString());
      try {
        const result = await runGraduationJob();
        console.log(`[Cron] 🎓 Graduation job complete — promoted: ${result.promoted}, skipped: ${result.skipped}, errors: ${result.errors.length}`);
      } catch (err) {
        console.error('[Cron] ❌ Graduation job failed:', err.message);
      }
    }, {
      timezone: 'Asia/Kolkata',  // IST — change to match your server timezone
    });
    console.log('✅ Graduation cron scheduled (daily 00:00 IST)');
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  });


module.exports = { app, io };

