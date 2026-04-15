const User = require('../models/User');

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, homeNumber, city, area, landmark, pincode, avatar } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update basic info
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    // Update location details
    if (address || homeNumber || city || area || landmark || pincode) {
      user.location = {
        ...user.location,
        address: address || user.location.address,
        city: city || user.location.city,
        area: area || user.location.area,
        landmark: landmark || user.location.landmark,
        pincode: pincode || user.location.pincode,
        homeNumber: user.role === 'user' ? (homeNumber || user.location.homeNumber) : undefined
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Capture New Avatar URL from Cloudinary
    user.avatar = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated',
      avatar: user.avatar
    });
  } catch (error) {
    next(error);
  }
};
