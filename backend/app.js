const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { getMissingEnv, OPTIONAL_SERVICE_GROUPS, REQUIRED_IN_PRODUCTION } = require('./config/validateEnv');

const app = express();
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const hasFrontendBuild = fs.existsSync(path.join(frontendDistPath, 'index.html'));

/**
 * 1. SECURITY & CONFIGURATION
 */
app.use(helmet({
  contentSecurityPolicy: false, // Relaxed for development/SEO flexibility
}));

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
    const error = new Error('Not allowed by CORS');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * 2. API HEALTH
 */
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const missingOptional = Object.fromEntries(
    Object.entries(OPTIONAL_SERVICE_GROUPS).map(([group, keys]) => [group, getMissingEnv(keys)])
  );

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    service: 'InstantSeva API',
    uptime: Math.round(process.uptime()),
    database: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
    frontendBuild: hasFrontendBuild,
    environment: {
      missingRequired: getMissingEnv(REQUIRED_IN_PRODUCTION),
      missingOptional
    }
  });
});

/**
 * 3. API ROUTES
 */
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

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

/**
 * 4. STATIC FILES & SPA ROUTING (LOWEST PRIORITY)
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (hasFrontendBuild) {
  // Serve static assets from the frontend build
  app.use(express.static(frontendDistPath));

  // Catch-all route to serve index.html for React SPA
  app.get(/^(?!\/api|\/sitemap\.xml|\/robots\.txt).+/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running... (Frontend build not found)');
  });
}

/**
 * 5. ERROR HANDLING
 */
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('API Error:', err.message);
  }
  const status = err.statusCode || 500;
  const isServerError = status >= 500;
  const message = isServerError && process.env.NODE_ENV === 'production'
    ? 'Something went wrong on our end'
    : err.message || 'Something went wrong on our end';

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
});

module.exports = app;
