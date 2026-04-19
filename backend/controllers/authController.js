const User = require('../models/User');
const OTP = require('../models/OTP');
const WorkerProfile = require('../models/WorkerProfile');
const { getWorkerModel } = require('../models/WorkerModels');
const PasswordReset = require('../models/PasswordReset');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const { toPublicUser } = require('../utils/userAccess');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { normalizeLanguage } = require('../utils/languages');
const logger = require('../utils/logger');

const MAX_OTP_ATTEMPTS = 5;
const MAX_PASSWORD_RESET_ATTEMPTS = 5;

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const normalizeCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;

  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;

  return [lng, lat];
};

const recordFailedAttempt = async (record, maxAttempts) => {
  record.attempts = (record.attempts || 0) + 1;
  record.lastAttemptAt = new Date();

  if (record.attempts >= maxAttempts) {
    await record.deleteOne();
    return true;
  }

  await record.save();
  return false;
};

const compareTokenHash = (storedHash, submittedHash) => {
  const stored = Buffer.from(String(storedHash), 'hex');
  const submitted = Buffer.from(String(submittedHash), 'hex');

  return stored.length === submitted.length && crypto.timingSafeEqual(stored, submitted);
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, address, homeNumber, phone, city, area, landmark, pincode, professions, experience, bio, location, preferredLanguage } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const requestedRole = role === 'worker' ? 'worker' : 'user';
    const coordinates = normalizeCoordinates(location?.coordinates || req.body.coordinates);

    if (!name || !normalizedEmail || !password || !phone) {
      return res.status(400).json({ success: false, message: req.t('registerRequired') });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: req.t('userExists') });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: requestedRole,
      phone,
      preferredLanguage: normalizeLanguage(preferredLanguage || req.language),
      location: {
        address,
        city,
        area,
        landmark,
        pincode,
        ...(coordinates ? { coordinates } : {}),
        homeNumber: requestedRole === 'user' ? homeNumber : undefined
      }
    });

    // If worker, create profile in specific profession collection
    if (requestedRole === 'worker') {
      const workerProfessions = professions || [];
      let targetCollection = 'multi_professional';

      if (workerProfessions.length === 1) {
        targetCollection = workerProfessions[0];
      } else if (workerProfessions.length === 0) {
        targetCollection = 'general';
      }

      const DynamicWorkerModel = getWorkerModel(targetCollection);
      
      await DynamicWorkerModel.create({ 
        user: user._id, 
        professions: workerProfessions,
        experience: experience || 0, 
        bio: bio || 'Professional service provider',
        pricing: { amount: 0, unit: 'hour' }
      });
      
      // Also maintain primary WorkerProfile for general searches (optional, but good for backward compat)
      await WorkerProfile.create({ 
        user: user._id, 
        experience: experience || 0, 
        bio: bio || 'Professional service provider',
        skills: workerProfessions 
      });
    }

    // Generate & Send OTP
    const otpCode = generateOTP();
    await OTP.create({ email: normalizedEmail, otp: otpCode });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - InstantSeva',
        message: `Your OTP for email verification is: ${otpCode}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h1 style="color: #4f46e5;">Welcome to InstantSeva!</h1>
            <p>Your verification code is: <strong style="font-size: 24px; color: #4f46e5; letter-spacing: 2px;">${otpCode}</strong></p>
            <p>This code expires in 10 minutes.</p>
          </div>
        `
      });
    } catch (err) {
      logger.warn('Email verification OTP sending failed', { email: user.email, error: err.message });
      // Don't fail the registration if email fails, but notify
    }

    res.status(201).json({
      success: true,
      message: req.t('registrationOk'),
      userId: user._id
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const submittedOtp = String(otp || '').trim();

    const otpRecord = await OTP.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: req.t('invalidOrExpiredOtp') });
    }

    if (otpRecord.otp !== submittedOtp) {
      const tooManyAttempts = await recordFailedAttempt(otpRecord, MAX_OTP_ATTEMPTS);
      return res.status(400).json({
        success: false,
        message: tooManyAttempts ? req.t('otpTooManyAttempts') : req.t('invalidOrExpiredOtp')
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    user.isVerified = true;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: await toPublicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: req.t('missingLoginFields') });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || user.isDeleted || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({ success: false, message: req.t('invalidCredentials') });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: req.t('verifyBeforeLogin') });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: await toPublicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: req.t('emailAlreadyVerified') });
    }
    
    await OTP.deleteMany({ email: normalizedEmail });
    const otpCode = generateOTP();
    await OTP.create({ email: normalizedEmail, otp: otpCode });

    await sendEmail({
      email: normalizedEmail,
      subject: 'Resend OTP - InstantSeva',
      message: `Your new OTP for InstantSeva is: ${otpCode}`,
      html: `<h1>InstantSeva</h1><p>Your new OTP is: <strong>${otpCode}</strong></p>`
    });

    res.status(200).json({ success: true, message: req.t('otpSentSuccessfully') });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: await toPublicUser(req.user)
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: req.t('emailRequired') });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json({ success: true, message: req.t('resetCodeSent') });
    }

    const resetToken = generateOTP();
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await PasswordReset.deleteMany({ email: user.email });
    await PasswordReset.create({ email: user.email, tokenHash });

    await sendEmail({
      email: user.email,
      subject: 'Password Reset - InstantSeva',
      message: `Your password reset code for InstantSeva is: ${resetToken}. It expires in 15 minutes.`,
      html: `<h1>Password Reset</h1><p>Your reset code is: <strong>${resetToken}</strong></p>`
    });

    res.status(200).json({ success: true, message: req.t('resetCodeSent') });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const submittedToken = String(token || '').trim();

    if (!normalizedEmail || !submittedToken || !password) {
      return res.status(400).json({ success: false, message: req.t('resetRequired') });
    }

    const tokenHash = crypto.createHash('sha256').update(submittedToken).digest('hex');
    const resetRecord = await PasswordReset.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: req.t('invalidOrExpiredResetCode') });
    }

    if (!compareTokenHash(resetRecord.tokenHash, tokenHash)) {
      const tooManyAttempts = await recordFailedAttempt(resetRecord, MAX_PASSWORD_RESET_ATTEMPTS);
      return res.status(400).json({
        success: false,
        message: tooManyAttempts ? req.t('resetTooManyAttempts') : req.t('invalidOrExpiredResetCode')
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    user.password = password;
    await user.save();
    await PasswordReset.deleteOne({ _id: resetRecord._id });

    res.status(200).json({ success: true, message: req.t('passwordUpdated') });
  } catch (error) {
    next(error);
  }
};
