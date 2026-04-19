const REQUIRED_IN_PRODUCTION = ['MONGO_URI', 'JWT_SECRET'];
const PRODUCTION_ORIGIN_KEYS = ['CLIENT_ORIGIN', 'RENDER_EXTERNAL_URL'];

const OPTIONAL_SERVICE_GROUPS = {
  smtp: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
  cloudinary: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
  geocoder: ['NOMINATIM_USER_AGENT'],
  push: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_CONTACT_EMAIL']
};

const getMissingEnv = (keys) => keys.filter((key) => !process.env[key]);

const hasProductionOrigin = () => PRODUCTION_ORIGIN_KEYS.some((key) => process.env[key]);

const validateProductionSecurity = () => {
  if (process.env.NODE_ENV !== 'production') return [];

  const failures = [];
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    failures.push('JWT_SECRET must be at least 32 characters in production');
  }
  if (!hasProductionOrigin()) {
    failures.push(`One production client origin is required: ${PRODUCTION_ORIGIN_KEYS.join(' or ')}`);
  }

  return failures;
};

const validateEnv = () => {
  const missingRequired = getMissingEnv(REQUIRED_IN_PRODUCTION);
  const securityFailures = validateProductionSecurity();

  if (process.env.NODE_ENV === 'production' && missingRequired.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }
  if (securityFailures.length > 0) {
    throw new Error(securityFailures.join('; '));
  }

  return {
    missingRequired,
    securityFailures,
    missingOptional: Object.fromEntries(
      Object.entries(OPTIONAL_SERVICE_GROUPS).map(([group, keys]) => [group, getMissingEnv(keys)])
    )
  };
};

module.exports = {
  OPTIONAL_SERVICE_GROUPS,
  PRODUCTION_ORIGIN_KEYS,
  REQUIRED_IN_PRODUCTION,
  getMissingEnv,
  validateEnv,
  validateProductionSecurity
};
