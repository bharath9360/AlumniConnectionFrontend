const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

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

/** Broadcast the current list of unique online user IDs to every client */
const broadcastOnlineUsers = () => {
  const uniqueIds = [...new Set(onlineUsers.values())];
  io.emit('online_users', uniqueIds);
};

io.on('connection', (socket) => {

  // User establishes their identity — joins a personal room for notifications
  socket.on('setup', (userData) => {
    const uid = userData?._id || userData?.id;
    if (!uid) return;

    socket.join(uid);
    socket.emit('connected');

    // Register presence
    onlineUsers.set(socket.id, uid.toString());
    broadcastOnlineUsers();
  });

  // User enters a specific chat window
  socket.on('join_chat', (room) => {
    socket.join(room);
  });

  // Real-time message dispatching
  socket.on('new_message', (newMessageReceived) => {
    const chat = newMessageReceived.chatId;
    if (!chat?.participants) return;

    chat.participants.forEach((participant) => {
      if (participant._id === newMessageReceived.senderId?._id) return;

      // Send the message
      socket.in(participant._id).emit('message_received', newMessageReceived);

      // Also send a notification bubble
      socket.in(participant._id).emit('notification_received', {
        _id: Date.now().toString(),
        type: 'message',
        title: `New message from ${newMessageReceived.senderId?.name || 'Someone'}`,
        description: newMessageReceived.content?.substring(0, 60) || 'You have a new message.',
        isRead: false,
        createdAt: new Date().toISOString(),
        relatedId: chat._id
      });
    });
  });

  // Typing indicators
  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing'));

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    broadcastOnlineUsers();
  });
});


// ─── Routes (must come AFTER io is attached to app) ──────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/admin', require('./routes/admin'));

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
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  });


module.exports = { app, io };

