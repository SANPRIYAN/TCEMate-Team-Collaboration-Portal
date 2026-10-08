const Notification = require('../models/Notification');

const createNotification = async ({
  user,
  title,
  message,
  icon = '🔔',
  type = 'system',
  relatedProject,
  relatedUser,
  session
}) => {
  if (!user) return null;

  const notification = new Notification({
    user,
    title,
    message,
    icon,
    type,
    relatedProject,
    relatedUser,
    unread: true,
    timeLabel: 'Just now'
  });
  await notification.save(session ? { session } : undefined);
  return notification;
};

module.exports = { createNotification };
