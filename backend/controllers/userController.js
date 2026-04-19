const User = require('../models/User');
const { toPublicUser } = require('../utils/userAccess');
const { normalizeLanguage } = require('../utils/languages');
const { getUploadedFilePayload } = require('../utils/uploadedFile');

const normalizeCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;

  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;

  return [lng, lat];
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, homeNumber, city, area, landmark, pincode, avatar, location, preferredLanguage } = req.body;
    const userId = req.user._id;
    const coordinates = normalizeCoordinates(location?.coordinates || req.body.coordinates);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    // Update basic info
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (preferredLanguage) user.preferredLanguage = normalizeLanguage(preferredLanguage);

    // Update location details
    if (address || homeNumber || city || area || landmark || pincode || coordinates) {
      user.location = {
        ...user.location,
        address: address || user.location.address,
        city: city || user.location.city,
        area: area || user.location.area,
        landmark: landmark || user.location.landmark,
        pincode: pincode || user.location.pincode,
        coordinates: coordinates || user.location.coordinates,
        homeNumber: user.role === 'user' ? (homeNumber || user.location.homeNumber) : undefined
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: req.t('profileUpdated'),
      user: await toPublicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: req.t('imageRequired') });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    // Capture New Avatar URL from Cloudinary
    user.avatar = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      message: req.t('avatarUpdated'),
      avatar: user.avatar
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadKYC = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: req.t('idProofRequired') });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    const idProof = getUploadedFilePayload(req.file);
    if (!idProof.url) {
      return res.status(400).json({ success: false, message: req.t('idProofRequired') });
    }

    user.kyc = {
      idProof,
      status: 'pending'
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: req.t('kycSubmitted'),
      data: {
        id: user._id,
        kyc: user.kyc
      }
    });
  } catch (error) {
    next(error);
  }
};
