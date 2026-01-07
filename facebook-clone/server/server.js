const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const friendRoutes = require('./routes/friends');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const storyRoutes = require('./routes/stories');
const groupRoutes = require('./routes/groups');
const pageRoutes = require('./routes/pages');
const eventRoutes = require('./routes/events');
const marketplaceRoutes = require('./routes/marketplace');
const searchRoutes = require('./routes/search');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create upload directories
const fs = require('fs');
const uploadDirs = [
  'uploads/avatars',
  'uploads/covers',
  'uploads/posts',
  'uploads/stories',
  'uploads/messages',
  'uploads/marketplace',
  'uploads/misc'
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(userId);

    // Notify friends that user is online
    socket.broadcast.emit('userOnline', userId);
    console.log(`User ${userId} joined`);
  });

  // Private messaging
  socket.on('sendMessage', (data) => {
    const { recipientId, message } = data;
    const recipientSocketId = connectedUsers.get(recipientId);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('newMessage', message);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { recipientId, conversationId, isTyping } = data;
    const recipientSocketId = connectedUsers.get(recipientId);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('userTyping', {
        conversationId,
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Message read
  socket.on('messageRead', (data) => {
    const { senderId, conversationId } = data;
    const senderSocketId = connectedUsers.get(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit('messagesRead', {
        conversationId,
        readBy: socket.userId
      });
    }
  });

  // Send notification
  socket.on('sendNotification', (data) => {
    const { recipientId, notification } = data;
    const recipientSocketId = connectedUsers.get(recipientId);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('newNotification', notification);
    }
  });

  // Video/Voice call signaling
  socket.on('callUser', (data) => {
    const { userToCall, signalData, from, name, callType } = data;
    const recipientSocketId = connectedUsers.get(userToCall);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('incomingCall', {
        signal: signalData,
        from,
        name,
        callType
      });
    }
  });

  socket.on('answerCall', (data) => {
    const { to, signal } = data;
    const recipientSocketId = connectedUsers.get(to);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('callAccepted', signal);
    }
  });

  socket.on('endCall', (data) => {
    const { to } = data;
    const recipientSocketId = connectedUsers.get(to);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('callEnded');
    }
  });

  // Story viewed
  socket.on('storyViewed', (data) => {
    const { authorId, storyId, viewerId } = data;
    const authorSocketId = connectedUsers.get(authorId);

    if (authorSocketId) {
      io.to(authorSocketId).emit('storyViewNotification', {
        storyId,
        viewerId
      });
    }
  });

  // Post interactions (real-time likes, comments)
  socket.on('postLiked', (data) => {
    socket.broadcast.emit('postUpdate', {
      type: 'like',
      ...data
    });
  });

  socket.on('postCommented', (data) => {
    socket.broadcast.emit('postUpdate', {
      type: 'comment',
      ...data
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      socket.broadcast.emit('userOffline', socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handler
app.use(errorHandler);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = { app, server, io };
