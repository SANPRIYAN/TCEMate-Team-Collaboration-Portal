const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

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

exports.register = async (req, res) => {
  try {
    const { fullName, email, regNo, phone, password } = req.body;

    if (!fullName || !email || !regNo || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const emailPattern = /^[^\s@]+@(student\.)?tce\.edu$/i;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid tce.edu email address.' });
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be 8+ chars with uppercase, lowercase, number, and special character.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { regNo }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email or register number already exists.' });
    }

    const user = await User.create({
      name: fullName,
      email,
      regNo,
      phone,
      password,
      department: 'Information Technology',
      year: '3rd Year',
      section: 'Section A',
      bio: '',
      skills: [],
      projects: [],
      preferences: { hackathon: true, internship: true }
    });

    const token = generateToken(user);
    res.status(201).json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Register error:', error.name, error.code || 'NO_CODE');
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'User with this email or register number already exists.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Registration data failed backend validation.' });
    }
    res.status(500).json({ success: false, message: 'Registration could not be completed. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch profile.' });
  }
};
