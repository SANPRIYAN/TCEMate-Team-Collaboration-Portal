const express = require('express');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  getMe,
  requestPasswordReset,
  resetPassword,
  resetPasswordWithPasskey,
  verifyEmail,
  adminSetupStatus,
  startAdminSetup
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { createRateLimit } = require('../middleware/rateLimit');
const { normalizeEmail } = require('../services/emailValidation');

const loginIpLimiter = createRateLimit({ limit: 60, windowMs: 15 * 60 * 1000 });
const loginAccountLimiter = createRateLimit({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  key: (req) => `${req.ip}:${normalizeEmail(req.body && req.body.email) || 'invalid-email'}`
});
const resetLimiter = createRateLimit({ limit: 3, windowMs: 15 * 60 * 1000 });

router.post('/register', createRateLimit({ limit: 5, windowMs: 60 * 60 * 1000 }), register);
router.post('/login', loginIpLimiter, loginAccountLimiter, login);
router.post('/admin/login', loginIpLimiter, loginAccountLimiter, adminLogin);
router.post('/verify-email', createRateLimit({ limit: 10, windowMs: 15 * 60 * 1000 }), verifyEmail);
router.get('/admin/setup/status', adminSetupStatus);
router.post('/admin/setup', createRateLimit({ limit: 5, windowMs: 60 * 60 * 1000 }), startAdminSetup);
router.post('/forgot-password', resetLimiter, requestPasswordReset);
router.patch('/forgot-password', resetLimiter, resetPasswordWithPasskey);
router.patch('/forgot-password-passkey', resetLimiter, resetPasswordWithPasskey);
router.patch('/reset-password-passkey', resetLimiter, resetPasswordWithPasskey);
router.post('/reset-password', resetLimiter, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
