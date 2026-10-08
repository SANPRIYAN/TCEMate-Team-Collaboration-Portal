const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['interest', 'accepted', 'rejected', 'skill-verified', 'skill-rejected', 'system'], default: 'system' },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    icon: { type: String, default: '🔔' },
    unread: { type: Boolean, default: true },
    timeLabel: { type: String, default: 'Just now' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
