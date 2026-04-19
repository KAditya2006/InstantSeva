require('dotenv').config();
const { validateEnv } = require('./config/validateEnv');
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Booking = require('./models/Booking');
const { getAllowedOrigins, isAllowedOrigin } = require('./utils/allowedOrigins');
const logger = require('./utils/logger');

validateEnv();

const PORT = process.env.PORT || 5000;
const allowedOrigins = getAllowedOrigins();

// Connect to Database
connectDB();

// Create Server
const server = http.createServer(app);
const onlineUserIds = new Set();
const onlineSocketCounts = new Map();
app.set('onlineUserIds', onlineUserIds);

const setUserPresence = ({ userId, isOnline }) => {
  io.emit('presence_updated', {
    userId: userId.toString(),
    isOnline
  });
};

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST']
  }
});

const Chat = require('./models/Chat');
const { markDeliveredForUser } = require('./controllers/chatController');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }
    if (user.isDeleted) {
      return next(new Error('User account is not active'));
    }

    socket.user = user;
    socket.join(user._id.toString());
    return next();
  } catch {
    return next(new Error('Authentication failed'));
  }
});

// Socket logic
io.on('connection', (socket) => {
  const socketUserId = socket.user._id.toString();
  const previousSocketCount = onlineSocketCounts.get(socketUserId) || 0;
  onlineSocketCounts.set(socketUserId, previousSocketCount + 1);
  onlineUserIds.add(socketUserId);

  if (previousSocketCount === 0) {
    setUserPresence({ userId: socketUserId, isOnline: true });
  }

  logger.dev('Socket connected', { userId: socketUserId });
  markDeliveredForUser({ io, userId: socket.user._id }).catch((error) => {
    logger.error('Message delivery receipt error', { error: error.message, userId: socketUserId });
  });

  socket.on('join_chat', async (chatId) => {
    const chat = await Chat.findOne({ _id: chatId, participants: socket.user._id });
    if (!chat) return;

    socket.join(chatId);
    logger.dev('User joined chat room', { userId: socket.user._id.toString(), chatId });
  });

  socket.on('join_booking', async (bookingId) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    // Only user or worker assigned can join
    if (booking.user.toString() !== socket.user._id.toString() && 
        booking.worker.toString() !== socket.user._id.toString()) return;

    socket.join(`booking_${bookingId}`);
    logger.dev('User joined booking room', { userId: socket.user._id.toString(), bookingId });
  });

  socket.on('update_worker_location', async (data) => {
    const { bookingId, coordinates } = data;
    if (!bookingId || !coordinates) return;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.worker.toString() !== socket.user._id.toString()) return;
    if (booking.status !== 'accepted' && booking.status !== 'in_progress') return;

    // Emit live update to user
    io.to(`booking_${bookingId}`).emit('worker_location_live', {
      bookingId,
      coordinates,
      timestamp: new Date()
    });

    // Periodic persistence (every 60s approx)
    const lastSnapshot = booking.workerLocationSnapshots[booking.workerLocationSnapshots.length - 1];
    const now = new Date();
    
    if (!lastSnapshot || (now - lastSnapshot.timestamp) > 60000) {
      booking.workerLocationSnapshots.push({
        coordinates,
        timestamp: now
      });
      await booking.save();
    }
  });

  socket.on('disconnect', () => {
    const nextSocketCount = (onlineSocketCounts.get(socketUserId) || 1) - 1;
    if (nextSocketCount <= 0) {
      onlineSocketCounts.delete(socketUserId);
      onlineUserIds.delete(socketUserId);
      setUserPresence({ userId: socketUserId, isOnline: false });
    } else {
      onlineSocketCounts.set(socketUserId, nextSocketCount);
    }

    logger.dev('Socket disconnected', { userId: socketUserId });
  });
});

// Attach io to app for use in controllers
app.set('io', io);

server.listen(PORT, () => {
  logger.info('Server running', {
    mode: process.env.NODE_ENV || 'development',
    port: PORT,
    allowedOrigins
  });
});
