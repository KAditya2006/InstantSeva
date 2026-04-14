const User = require('../models/User');
const OTP = require('../models/OTP');
const WorkerProfile = require('../models/WorkerProfile');
const { getWorkerModel } = require('../models/WorkerModels');
const PasswordReset = require('../models/PasswordReset');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isVerified: user.isVerified
});

exports.register = async (req, res, next) => {
  console.log('--- Registration Attempt ---');
  console.log('Email:', req.body.email);
  console.log('Role:', req.body.role);
  try {
    const { name, email, password, role, address, homeNumber, professions, experience, bio } = req.body;
    const requestedRole = role === 'worker' ? 'worker' : 'user';

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: requestedRole,
      location: {
        address,
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
    await OTP.create({ email, otp: otpCode });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - Hyperlocal Marketplace',
        message: `Your OTP for email verification is: ${otpCode}. It expires in 10 minutes.`,
        html: `<h1>Verify Your Email</h1><p>Your OTP is: <strong>${otpCode}</strong></p>`
      });
    } catch (err) {
      console.error('Email sending failed:', err);
      // Don't fail the registration if email fails, but notify
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      userId: user._id
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }
    
    await OTP.deleteMany({ email });
    const otpCode = generateOTP();
    await OTP.create({ email, otp: otpCode });

    await sendEmail({
      email,
      subject: 'Resend OTP - Hyperlocal Marketplace',
      message: `Your new OTP is: ${otpCode}`,
      html: `<h1>Your New OTP</h1><p>OTP: <strong>${otpCode}</strong></p>`
    });

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: serializeUser(req.user)
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account exists, a reset code has been sent' });
    }

    const resetToken = generateOTP();
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await PasswordReset.deleteMany({ email: user.email });
    await PasswordReset.create({ email: user.email, tokenHash });

    await sendEmail({
      email: user.email,
      subject: 'Password Reset - Hyperlocal Marketplace',
      message: `Your password reset code is: ${resetToken}. It expires in 15 minutes.`,
      html: `<h1>Password Reset</h1><p>Your reset code is: <strong>${resetToken}</strong></p>`
    });

    res.status(200).json({ success: true, message: 'If an account exists, a reset code has been sent' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({ success: false, message: 'Email, reset code, and new password are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await PasswordReset.findOne({ email, tokenHash });

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = password;
    await user.save();
    await PasswordReset.deleteOne({ _id: resetRecord._id });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};
