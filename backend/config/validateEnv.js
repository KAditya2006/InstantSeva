const REQUIRED_IN_PRODUCTION = ['MONGO_URI', 'JWT_SECRET'];

const OPTIONAL_SERVICE_GROUPS = {
  smtp: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
  cloudinary: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
  geocoder: ['NOMINATIM_USER_AGENT']
};

const getMissingEnv = (keys) => keys.filter((key) => !process.env[key]);

const validateEnv = () => {
  const missingRequired = getMissingEnv(REQUIRED_IN_PRODUCTION);

  if (process.env.NODE_ENV === 'production' && missingRequired.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }

  return {
    missingRequired,
    missingOptional: Object.fromEntries(
      Object.entries(OPTIONAL_SERVICE_GROUPS).map(([group, keys]) => [group, getMissingEnv(keys)])
    )
  };
};

module.exports = { OPTIONAL_SERVICE_GROUPS, REQUIRED_IN_PRODUCTION, getMissingEnv, validateEnv };
