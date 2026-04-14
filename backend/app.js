const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// Middlewares
app.use(helmet());
const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const renderOrigin = process.env.RENDER_EXTERNAL_URL;
const allowedOrigins = renderOrigin ? [...configuredOrigins, renderOrigin] : configuredOrigins;

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user', userRoutes);

const frontendDistPath = path.join(__dirname, '../frontend/dist');
const hasFrontendBuild = require('fs').existsSync(path.join(frontendDistPath, 'index.html'));

// Serve Frontend when a production build is available
if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong on our end';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
});

module.exports = app;
