const { normalizeLanguage } = require('./languages');

const messages = {
  en: {
    userNotFound: 'User not found',
    profileUpdated: 'Profile updated successfully',
    imageRequired: 'Please upload an image',
    avatarUpdated: 'Profile picture updated',
    idProofRequired: 'Please upload your ID Proof',
    kycSubmitted: 'KYC submitted successfully for review',
    missingLoginFields: 'Please provide email and password',
    invalidCredentials: 'Invalid credentials',
    verifyBeforeLogin: 'Please verify your email before logging in',
    userExists: 'User already exists',
    registrationOk: 'Registration successful. Please verify your email.',
    adminNameEmailPasswordRequired: 'Name, email, and password are required',
    adminWorkerRequired: 'Name, email, password, skills, and bio are required',
    adminUserExists: 'A user with this email already exists',
    adminUserCreated: 'User added successfully',
    adminWorkerCreated: 'Worker added successfully',
    adminCannotDeleteSelf: 'You cannot delete your own admin account',
    adminUserNotFound: 'User not found',
    adminWorkerNotFound: 'Worker not found',
    adminWorkerAccountNotFound: 'Worker account not found',
    adminUserActiveBooking: 'This user has an active booking. Complete or cancel active bookings before deleting.',
    adminWorkerActiveBooking: 'This worker has an active booking. Complete or cancel active bookings before deleting.',
    adminUserDeleted: 'User deleted successfully',
    adminWorkerDeleted: 'Worker deleted successfully',
    invalidStatus: 'Invalid status',
    identityNotFound: 'Identity record not found',
    identityVerifiedTitle: 'Identity Verified',
    verificationRejectedTitle: 'Verification Rejected',
    identityVerifiedMessage: 'Your account has been successfully verified. You now have full access to platform features.',
    documentsUnclear: 'Documents were unclear',
    verificationRejectedMessage: 'Your verification request was declined. Reason: {{reason}}. Please re-upload your ID proof.',
    identityStatusUpdated: 'Identity {{status}} successfully',
    chatValidRecipientRequired: 'A valid recipient is required',
    recipientNotFound: 'Recipient not found',
    chatRestricted: 'You can only start chats related to approved services or your assigned jobs',
    chatNotFound: 'Chat not found',
    messageEmpty: 'Message cannot be empty',
    imageRequiredForChat: 'No image uploaded',
    newMessageTitle: 'New message',
    sentImage: 'Sent an image',
    sentImageNotification: '{{name}} sent an image'
  },
  hi: {
    userNotFound: 'User not found',
    profileUpdated: 'प्रोफाइल सफलतापूर्वक अपडेट हो गया',
    imageRequired: 'कृपया एक image upload करें',
    avatarUpdated: 'Profile picture update हो गई',
    idProofRequired: 'कृपया अपना ID Proof upload करें',
    kycSubmitted: 'KYC review के लिए submit हो गया',
    missingLoginFields: 'कृपया email और password डालें',
    invalidCredentials: 'Email या password गलत है',
    verifyBeforeLogin: 'Login से पहले कृपया अपना email verify करें',
    userExists: 'User already exists',
    registrationOk: 'Registration successful. कृपया अपना email verify करें।'
  },
  or: {
    profileUpdated: 'ପ୍ରୋଫାଇଲ ସଫଳତାର ସହିତ ଅପଡେଟ୍ ହେଲା',
    invalidCredentials: 'ଇମେଲ୍ କିମ୍ବା ପାସୱାର୍ଡ ଭୁଲ',
    verifyBeforeLogin: 'ଲଗିନ ପୂର୍ବରୁ ଦୟାକରି ଇମେଲ୍ verify କରନ୍ତୁ'
  },
  ur: {
    profileUpdated: 'پروفائل کامیابی سے اپڈیٹ ہو گیا',
    invalidCredentials: 'ای میل یا پاس ورڈ غلط ہے',
    verifyBeforeLogin: 'لاگ اِن سے پہلے اپنا ای میل verify کریں'
  }
};

const interpolate = (message, params = {}) => {
  return String(message).replace(/\{\{(\w+)\}\}/g, (_, token) => (
    params[token] === undefined || params[token] === null ? '' : String(params[token])
  ));
};

const tServer = (key, language = 'en', params = {}) => {
  const lang = normalizeLanguage(language);
  const message = messages[lang]?.[key] || messages.en[key] || key;
  return interpolate(message, params);
};

module.exports = {
  tServer
};
