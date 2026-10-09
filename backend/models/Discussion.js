const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  author: { type: String, default: 'Anonymous' },
  text: { type: String, required: true, trim: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  voters: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: Number }
  }],
  createdAt: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema(
  {
    tag: { type: String, default: 'Discussion' },
    author: { type: String, default: 'Anonymous' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    voters: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      vote: { type: Number }
    }],
    comments: [commentSchema],
    replies: { type: Number, default: 0 },
    timeLabel: { type: String, default: 'Just now' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Discussion', discussionSchema);

