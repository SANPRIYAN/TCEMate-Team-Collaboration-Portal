const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    icon: { type: String, default: '🔔' },
    unread: { type: Boolean, default: true },
    timeLabel: { type: String, default: 'Just now' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
