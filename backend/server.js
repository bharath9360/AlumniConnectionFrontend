const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const cron = require('node-cron');
const { Server } = require('socket.io');
require('dotenv').config();

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Global sanitization — strip XSS vectors from all request bodies
app.use(sanitizeBody);

// Serve uploads folder statically with CORS headers for cross-origin deployments (Vercel → Railway)
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ─── Socket.io Setup ──────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
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

/** Broadcast the current list of unique online user IDs to every client */
const broadcastOnlineUsers = () => {
  const uniqueIds = [...new Set(onlineUsers.values())];
  io.emit('online_users', uniqueIds);
  if (process.env.NODE_ENV !== 'test') {
    console.log(`📊 Online users: ${uniqueIds.length}`);
  }
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
  socket.on('disconnect', () => {
    const userId = onlineUsers.get(socket.id);
    if (userId) {
      onlineUsers.delete(socket.id);
      // If user has no more sockets, clear their active chats
      const stillOnline = [...onlineUsers.values()].includes(userId);
      if (!stillOnline) activeChats.delete(userId);
    }
    broadcastOnlineUsers();
  });
});


// ─── Routes (must come AFTER io is attached to app) ──────────
app.use('/api/auth',         authLimiter, require('./routes/auth'));
app.use('/api/users',        apiLimiter,  require('./routes/users'));
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

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

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

