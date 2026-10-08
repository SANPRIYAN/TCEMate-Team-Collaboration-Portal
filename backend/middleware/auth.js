const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name email regNo role isActive');
    if (!user || user.isActive === false) return res.status(401).json({ success: false, message: 'Not authenticated.' });

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      regNo: user.regNo,
      role: user.role || 'student'
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
};

const protect = authenticate;

const optionalProtect = async (req, res, next) => {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
};

const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Administrator access is required.' });
  return next();
};

module.exports = { protect, optionalProtect, requireAdmin };
