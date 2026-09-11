const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCurrentUser, updateCurrentUser } = require('../controllers/userController');

router.get('/me', protect, getCurrentUser);
router.put('/me', protect, updateCurrentUser);

module.exports = router;
