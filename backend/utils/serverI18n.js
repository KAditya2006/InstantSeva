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
    registrationOk: 'Registration successful. Please verify your email.'
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

const tServer = (key, language = 'en') => {
  const lang = normalizeLanguage(language);
  return messages[lang]?.[key] || messages.en[key] || key;
};

module.exports = {
  tServer
};
