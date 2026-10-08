const mongoose = require('mongoose');
const User = require('../models/User');
const { normalizeSkillName, normalizeSkills } = require('../services/skillService');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  regNo: user.regNo,
  phone: user.phone,
  role: user.role || 'student',
  department: user.department,
  year: user.year,
  section: user.section,
  bio: user.bio,
  skills: normalizeSkills(user.skills, user._id),
  projects: user.projects,
  preferences: user.preferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const persistNormalizedSkills = async (user) => {
  const normalized = normalizeSkills(user.skills, user._id);
  if (JSON.stringify(user.skills || []) !== JSON.stringify(normalized)) {
    user.skills = normalized;
    user.markModified('skills');
    await user.save();
  }
  return normalized;
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await persistNormalizedSkills(user);
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch current user.' });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const { name, department, year, section, bio, phone, preferences } = req.body;
    if (name !== undefined && (typeof name !== 'string' || !/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/.test(name.trim()) || name.trim().length > 100)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid name.' });
    }
    if (phone !== undefined && (typeof phone !== 'string' || !/^\d{10}$/.test(phone.trim()))) {
      return res.status(400).json({ success: false, message: 'Phone number must contain 10 digits.' });
    }
    if (bio !== undefined && (typeof bio !== 'string' || bio.length > 1000)) {
      return res.status(400).json({ success: false, message: 'Bio must be 1000 characters or fewer.' });
    }
    if (preferences !== undefined && (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)
      || Object.keys(preferences).some((key) => !['hackathon', 'internship'].includes(key))
      || Object.values(preferences).some((value) => typeof value !== 'boolean'))) {
      return res.status(400).json({ success: false, message: 'Preferences are invalid.' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if ((user.role || 'student') !== 'student') return res.status(403).json({ success: false, message: 'Only student profiles can be updated here.' });
    if (name !== undefined) user.name = name.trim();
    if (department !== undefined) user.department = String(department).trim().slice(0, 100);
    if (year !== undefined) user.year = String(year).trim().slice(0, 30);
    if (section !== undefined) user.section = String(section).trim().slice(0, 30);
    if (bio !== undefined) user.bio = bio.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (preferences !== undefined) user.preferences = { ...user.preferences.toObject(), ...preferences };
    await persistNormalizedSkills(user);
    await user.save();
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Profile data failed backend validation.' });
    return res.status(500).json({ success: false, message: 'Unable to update profile.' });
  }
};

exports.addSkill = async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  if (Object.keys(body).some((key) => key !== 'name')) {
    return res.status(400).json({ success: false, message: 'Only the skill name may be provided.' });
  }
  const name = normalizeSkillName(body.name);
  if (!name || name.length > 50) return res.status(400).json({ success: false, message: 'Enter a skill name up to 50 characters.' });
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if ((user.role || 'student') !== 'student') return res.status(403).json({ success: false, message: 'Only students can manage profile skills.' });
    const skills = normalizeSkills(user.skills, user._id);
    if (skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ success: false, message: 'This skill is already listed.' });
    }
    skills.push({ id: new mongoose.Types.ObjectId().toString(), name });
    user.skills = skills;
    user.markModified('skills');
    await user.save();
    return res.status(201).json({ success: true, skills: normalizeSkills(user.skills, user._id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to add skill.' });
  }
};

exports.updateSkill = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.skillId)) {
    return res.status(400).json({ success: false, message: 'Invalid skill ID.' });
  }
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  if (Object.keys(body).some((key) => key !== 'name')) {
    return res.status(400).json({ success: false, message: 'Only the skill name may be changed.' });
  }
  const name = normalizeSkillName(body.name);
  if (!name || name.length > 50) return res.status(400).json({ success: false, message: 'Enter a skill name up to 50 characters.' });
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if ((user.role || 'student') !== 'student') return res.status(403).json({ success: false, message: 'Only students can manage profile skills.' });
    const skills = normalizeSkills(user.skills, user._id);
    const skill = skills.find((item) => item.id === req.params.skillId);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found.' });
    if (skills.some((item) => item.id !== skill.id && item.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ success: false, message: 'This skill is already listed.' });
    }
    skill.name = name;
    user.skills = skills;
    user.markModified('skills');
    await user.save();
    return res.json({ success: true, skills: normalizeSkills(user.skills, user._id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update skill.' });
  }
};

exports.deleteSkill = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.skillId)) {
    return res.status(400).json({ success: false, message: 'Invalid skill ID.' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if ((user.role || 'student') !== 'student') return res.status(403).json({ success: false, message: 'Only students can manage profile skills.' });
    const skills = normalizeSkills(user.skills, user._id);
    const remaining = skills.filter((skill) => skill.id !== req.params.skillId);
    if (remaining.length === skills.length) return res.status(404).json({ success: false, message: 'Skill not found.' });
    user.skills = remaining;
    user.markModified('skills');
    await user.save();
    return res.json({ success: true, skills: normalizeSkills(user.skills, user._id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to remove skill.' });
  }
};
