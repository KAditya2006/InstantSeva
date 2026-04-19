const formatMeta = (meta) => {
  if (!meta || Object.keys(meta).length === 0) return '';

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return '';
  }
};

const write = (level, message, meta) => {
  const payload = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}${formatMeta(meta)}`;
  const writer = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  writer(payload);
};

const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
  dev: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      write('debug', message, meta);
    }
  }
};

module.exports = logger;
