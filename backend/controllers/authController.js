const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { isValidTceStudentEmail, normalizeEmail } = require('../services/emailValidation');
const { sendPasswordResetEmail } = require('../services/emailService');
const User = require('../models/User');

const generateToken = (user) => jwt.sign(
  { id: user._id, role: user.role || 'student' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

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
  skills: user.skills,
  projects: user.projects,
  preferences: user.preferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const validPassword = (password) => typeof password === 'string'
  && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,128}$/.test(password);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const configuredAdminSetupEmail = () => {
  const email = normalizeEmail(process.env.ADMIN_SETUP_EMAIL);
  return isValidEmail(email) ? email : '';
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const adminSetupSecretMatches = (candidate, configured) => (
  typeof candidate === 'string'
  && candidate.length >= 32
  && candidate.length <= 256
  && crypto.timingSafeEqual(
    crypto.createHash('sha256').update(candidate).digest(),
    crypto.createHash('sha256').update(configured).digest()
  )
);

const login = async (req, res, requiredRole) => {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const email = normalizeEmail(body.email);
    const password = body.password;
    if (!email || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user || !await user.comparePassword(password) || user.role !== requiredRole) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account is not active. Please contact support.' });
    }
    if (requiredRole === 'student' && !isValidTceStudentEmail(email)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return res.json({
      success: true,
      token: generateToken(user),
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login failed:', error.code || error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Login could not be completed. Please try again.' });
  }
};

exports.register = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { fullName, email, regNo, phone, password } = body;
    if (![fullName, email, regNo, phone, password].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/.test(fullName.trim()) || fullName.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Please enter a valid full name.' });
    }
    const normalizedEmail = normalizeEmail(email);
    if (!isValidTceStudentEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please register using your official TCE student email address.' });
    }
    if (!/^[a-zA-Z0-9]{5,30}$/.test(regNo.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid register number.' });
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'Phone number must contain 10 digits.' });
    }
    if (!validPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be 8-128 characters with uppercase, lowercase, a number, and a special character.' });
    }

    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { regNo: regNo.trim() }] });
    if (existingUser) return res.status(409).json({ success: false, message: 'User with this email or register number already exists.' });

    const user = await User.create({
      name: fullName.trim(),
      email: normalizedEmail,
      regNo: regNo.trim(),
      phone: phone.trim(),
      password,
      role: 'student',
      isEmailVerified: false,
      isActive: true
    });
    return res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      message: 'Registration successful. You can now log in.'
    });
  } catch (error) {
    console.error('Registration failed:', error.name || 'UnknownError', error.code || '');
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'User with this email or register number already exists.' });
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Registration data failed backend validation.' });
    return res.status(500).json({ success: false, message: 'Registration could not be completed. Please try again.' });
  }
};

exports.login = (req, res) => login(req, res, 'student');
exports.adminLogin = (req, res) => login(req, res, 'admin');

exports.verifyEmail = async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { token } = body;
  try {
    if (typeof token === 'string' && /^[a-f0-9]{64}$/i.test(token)) {
      const legacyUser = await User.findOneAndUpdate({
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: { $gt: new Date() },
        isEmailVerified: false
      }, {
        $set: { isEmailVerified: true, isActive: true },
        $unset: {
          emailVerificationTokenHash: 1,
          emailVerificationExpiresAt: 1,
          verificationEmailSentAt: 1
        }
      }, { new: true, runValidators: true });
      if (!legacyUser) return res.status(410).json({ success: false, message: 'This verification link is invalid, expired, or already used.' });
      return res.json({ success: true, message: 'Your email is verified. You can now log in.' });
    }
    return res.status(400).json({ success: false, message: 'A valid legacy verification link is required.' });
  } catch (error) {
    console.error('Email verification failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Email verification could not be completed.' });
  }
};

exports.adminSetupStatus = async (req, res) => {
  try {
    const hasAdmin = await User.exists({ role: 'admin' });
    const setupSecretConfigured = typeof process.env.ADMIN_SETUP_SECRET === 'string'
      && process.env.ADMIN_SETUP_SECRET.length >= 32
      && process.env.ADMIN_SETUP_SECRET.length <= 256;
    return res.json({
      success: true,
      available: !hasAdmin && Boolean(configuredAdminSetupEmail()) && setupSecretConfigured
    });
  } catch (error) {
    console.error('Admin setup status check failed:', error.name || 'UnknownError');
    return res.status(503).json({ success: false, message: 'Administrator setup status is temporarily unavailable.' });
  }
};

exports.startAdminSetup = async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { fullName, email, password, confirmPassword, setupSecret } = body;
  const normalizedEmail = normalizeEmail(email);
  const allowedEmail = configuredAdminSetupEmail();
  const configuredSetupSecret = process.env.ADMIN_SETUP_SECRET;
  if (!allowedEmail) {
    return res.status(503).json({ success: false, message: 'Administrator setup is not configured.' });
  }
  if (typeof configuredSetupSecret !== 'string'
    || configuredSetupSecret.length < 32
    || configuredSetupSecret.length > 256) {
    return res.status(503).json({ success: false, message: 'Administrator setup is not configured.' });
  }
  if (!adminSetupSecretMatches(setupSecret, configuredSetupSecret)) {
    return res.status(403).json({ success: false, message: 'Administrator setup authorization failed.' });
  }
  if (normalizedEmail !== allowedEmail) {
    return res.status(403).json({ success: false, message: 'This email is not authorized for administrator setup.' });
  }
  if (typeof fullName !== 'string' || !/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/.test(fullName.trim())
    || fullName.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Enter a name using letters, spaces, apostrophes, or hyphens (up to 100 characters).' });
  }
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  }
  if (!validPassword(password)) {
    return res.status(400).json({ success: false, message: 'Password must be 8-128 characters and include uppercase and lowercase letters, a number, and a symbol.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  try {
    if (await User.exists({ role: 'admin' })) {
      return res.status(409).json({ success: false, message: 'Administrator setup has already been completed.' });
    }
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: 'An account already uses this email address.' });
    }
    const passwordHash = await User.hashPassword(password);
    const user = await User.createWithPasswordHash({
      name: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
      isEmailVerified: false,
      isActive: true
    });
    return res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      message: 'Administrator account created successfully. You can now log in.'
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Administrator setup has already been completed.' });
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Administrator setup data failed backend validation.' });
    console.error('Administrator setup failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Administrator setup could not be completed.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch profile.' });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const genericMessage = 'If an account exists for that email, password reset instructions have been sent.';
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const email = normalizeEmail(body.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  try {
    const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    if (!user) return res.status(202).json({ success: true, message: genericMessage });
    if (user.role === 'student' && !isValidTceStudentEmail(email)) {
      return res.status(202).json({ success: true, message: genericMessage });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (error) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      console.error('Password reset email delivery failed:', error.code || error.name || 'UnknownError');
      return res.status(503).json({ success: false, message: 'Password reset email could not be sent. Please try again later.' });
    }
    return res.status(202).json({ success: true, message: genericMessage });
  } catch (error) {
    console.error('Password reset request failed:', error.name || 'UnknownError');
    return res.status(503).json({ success: false, message: 'Password reset is temporarily unavailable. Please try again later.' });
  }
};

exports.resetPassword = async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { token, password } = body;
  if (typeof token !== 'string' || !token || !validPassword(password)) {
    return res.status(400).json({ success: false, message: 'A valid reset token and password are required.' });
  }
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const passwordHash = await User.hashPassword(password);
    const user = await User.findOneAndUpdate({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() }
    }, {
      $set: { password: passwordHash },
      $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 }
    }, { new: true, runValidators: true });
    if (!user) return res.status(410).json({ success: false, message: 'This password reset link is invalid or expired.' });
    return res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Password reset failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Password reset could not be completed.' });
  }
};

exports.sanitizeUser = sanitizeUser;
