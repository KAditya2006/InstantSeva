const rateLimit = require('express-rate-limit');

const { tServer } = require('../utils/serverI18n');
const { normalizeLanguage } = require('../utils/languages');

const getRequestLanguage = (req) => normalizeLanguage(
  req.language ||
  req.headers['x-language'] ||
  String(req.headers['accept-language'] || '').split(',')[0] ||
  'en'
);

const createJsonLimiter = ({ windowMs, limit, messageKey, skipSuccessfulRequests = false }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: tServer(messageKey, getRequestLanguage(req))
    });
  }
});

const authLimiter = createJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  messageKey: 'authRateLimited'
});

const registrationLimiter = createJsonLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  messageKey: 'signupRateLimited'
});

const loginLimiter = createJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  messageKey: 'loginRateLimited'
});

const otpLimiter = createJsonLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  messageKey: 'otpRateLimited'
});

const passwordResetLimiter = createJsonLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 6,
  messageKey: 'passwordResetRateLimited'
});

const chatMessageLimiter = createJsonLimiter({
  windowMs: 60 * 1000,
  limit: 40,
  messageKey: 'chatRateLimited'
});

const locationSearchLimiter = createJsonLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  messageKey: 'locationRateLimited'
});

module.exports = {
  authLimiter,
  chatMessageLimiter,
  locationSearchLimiter,
  loginLimiter,
  otpLimiter,
  passwordResetLimiter,
  registrationLimiter
};
