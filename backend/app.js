const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { getMissingEnv, OPTIONAL_SERVICE_GROUPS, REQUIRED_IN_PRODUCTION } = require('./config/validateEnv');
const { getAllowedOrigins, isAllowedOrigin } = require('./utils/allowedOrigins');
const languageMiddleware = require('./middleware/languageMiddleware');
const logger = require('./utils/logger');

const app = express();
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const hasFrontendBuild = fs.existsSync(path.join(frontendDistPath, 'index.html'));

/**
 * 1. SECURITY & CONFIGURATION
 */
const isProduction = process.env.NODE_ENV === 'production';
const contentSecurityPolicy = isProduction ? {
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc: ["'self'", 'https:', 'wss:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https:']
  }
} : false;

app.use(helmet({ contentSecurityPolicy }));

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin, allowedOrigins)) {
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
app.use(languageMiddleware);

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
    message: req.t('apiRouteNotFound')
  });
});

/**
 * 4. STATIC FILES & SPA ROUTING (LOWEST PRIORITY)
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (hasFrontendBuild) {
  const seoStaticFiles = {
    '/sitemap.xml': { fileName: 'sitemap.xml', contentType: 'application/xml; charset=utf-8' },
    '/robots.txt': { fileName: 'robots.txt', contentType: 'text/plain; charset=utf-8' },
    '/site.webmanifest': { fileName: 'site.webmanifest', contentType: 'application/manifest+json; charset=utf-8' }
  };

  Object.entries(seoStaticFiles).forEach(([route, fileConfig]) => {
    app.get(route, (req, res, next) => {
      const filePath = path.join(frontendDistPath, fileConfig.fileName);

      if (!fs.existsSync(filePath)) {
        return next();
      }

      res.setHeader('Content-Type', fileConfig.contentType);
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.sendFile(filePath);
    });
  });

  // Serve static assets from the frontend build
  app.use(express.static(frontendDistPath));

  // Catch-all route to serve index.html for React SPA
  app.get(/^(?!\/api|\/sitemap\.xml|\/robots\.txt|\/site\.webmanifest).+/, (req, res) => {
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
    logger.error('API Error', { message: err.message, path: req.originalUrl });
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
