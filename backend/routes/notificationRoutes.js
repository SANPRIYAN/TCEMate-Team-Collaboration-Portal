const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, markNotificationRead, markAllNotificationsRead } = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markNotificationRead);
router.put('/read-all', protect, markAllNotificationsRead);

module.exports = router;
