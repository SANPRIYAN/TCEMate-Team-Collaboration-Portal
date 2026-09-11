const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema(
  {
    tag: { type: String, default: 'Discussion' },
    author: { type: String, default: 'Anonymous' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    replies: { type: Number, default: 0 },
    timeLabel: { type: String, default: 'Just now' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Discussion', discussionSchema);
