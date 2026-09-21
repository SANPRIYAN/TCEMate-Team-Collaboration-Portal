const Notification = require('../models/Notification');

const createNotification = async ({ user, title, message, icon = '🔔' }) => {
  if (!user) return null;

  const existing = await Notification.findOne({ user, title, message });
  if (existing) return existing;

  return Notification.create({
    user,
    title,
    message,
    icon,
    unread: true,
    timeLabel: 'Just now'
  });
};

module.exports = { createNotification };
