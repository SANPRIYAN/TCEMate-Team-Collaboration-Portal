const Notification = require('../models/Notification');

const notificationToResponse = (notification) => ({
  id: notification._id,
  user: notification.user,
  title: notification.title,
  message: notification.message,
  icon: notification.icon,
  unread: notification.unread,
  timeLabel: notification.timeLabel,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt
});

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, notifications: notifications.map(notificationToResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch notifications.' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.unread = false;
    await notification.save();
    res.json({ success: true, notification: notificationToResponse(notification) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update notification.' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id }, { unread: false });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update notifications.' });
  }
};
