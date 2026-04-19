const { normalizeLanguage } = require('../utils/languages');
const { tServer } = require('../utils/serverI18n');

const getPreferredLanguage = (req) => {
  const explicit = req.query.lang || req.body?.preferredLanguage || req.headers['x-language'];
  if (explicit) return normalizeLanguage(explicit);

  const acceptLanguage = req.headers['accept-language'];
  if (!acceptLanguage) return 'en';

  const firstLanguage = String(acceptLanguage).split(',')[0];
  return normalizeLanguage(firstLanguage);
};

const languageMiddleware = (req, res, next) => {
  req.language = getPreferredLanguage(req);
  req.t = (key, params) => tServer(key, req.language, params);
  res.setHeader('Content-Language', req.language);
  next();
};

module.exports = languageMiddleware;
