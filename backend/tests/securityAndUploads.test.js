const assert = require('node:assert/strict');
const Booking = require('../models/Booking');
const { getUploadedFilePayload } = require('../utils/uploadedFile');
const { validateProductionSecurity } = require('../config/validateEnv');

const test = (name, fn) => {
  fn();
  console.log(`ok - ${name}`);
};

test('booking OTP fields include expiry and attempt counters', () => {
  assert.ok(Booking.schema.path('startOTPExpiresAt'));
  assert.ok(Booking.schema.path('startOTPAttempts'));
  assert.ok(Booking.schema.path('completionOTPExpiresAt'));
  assert.ok(Booking.schema.path('completionOTPAttempts'));
});

test('uploaded file payload supports cloud and local storage shapes', () => {
  assert.deepEqual(
    getUploadedFilePayload({ path: 'https://cdn.example/id.pdf', filename: 'marketplace_kyc/id' }),
    { url: 'https://cdn.example/id.pdf', publicId: 'marketplace_kyc/id' }
  );
  assert.deepEqual(
    getUploadedFilePayload({ location: '/uploads/id.png', key: 'uploads/id.png' }),
    { url: '/uploads/id.png', publicId: 'uploads/id.png' }
  );
});

test('production env validation rejects weak secrets and missing origins', () => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL
  };

  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = 'short';
  delete process.env.CLIENT_ORIGIN;
  delete process.env.RENDER_EXTERNAL_URL;

  const failures = validateProductionSecurity();
  assert.ok(failures.some((failure) => failure.includes('JWT_SECRET')));
  assert.ok(failures.some((failure) => failure.includes('production client origin')));

  Object.entries(originalEnv).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
});
