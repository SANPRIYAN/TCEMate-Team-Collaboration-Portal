const User = require('../models/User');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  regNo: user.regNo,
  phone: user.phone,
  department: user.department,
  year: user.year,
  section: user.section,
  bio: user.bio,
  skills: user.skills,
  projects: user.projects,
  preferences: user.preferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch current user.' });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const allowedFields = ['name', 'department', 'year', 'section', 'bio', 'skills', 'projects', 'preferences', 'phone'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error('User update error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to update profile.' });
  }
};
