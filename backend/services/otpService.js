const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, type = 'Start', validFor = '6 hours') => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    logger.dev('OTP generated', { email, type, otp });
  }

  try {
    await sendEmail({
      email,
      subject: `Your ${type} Verification Code for InstantSeva`,
      message: `Your ${type.toLowerCase()} verification code for InstantSeva is ${otp}. This code is valid for ${validFor}.`,
      html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 12px;">
        <h1 style="color: #4f46e5; margin-bottom: 24px;">InstantSeva</h1>
        <p style="font-size: 16px; line-height: 1.5;">Please use the following single-use code to verify your action on InstantSeva:</p>
        <div style="background: #f8fafc; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <h1 style="color: #4f46e5; letter-spacing: 12px; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code is valid for ${validFor}. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">(c) 2026 InstantSeva. All rights reserved.</p>
      </div>
    `
    });
  } catch (error) {
    if (isDev && error.code === 'SMTP_CONFIG_MISSING') {
      logger.warn('SMTP is not configured; OTP was logged only', { email, type });
      return;
    }

    logger.error('OTP email sending failed', { email, type, error: error.message });
    if (!isDev) throw new Error('Could not send OTP email');
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};
