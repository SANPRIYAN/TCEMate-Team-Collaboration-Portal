const Discussion = require('../models/Discussion');
const mongoose = require('mongoose');

const discussionToResponse = (discussion) => ({
  id: discussion._id,
  tag: discussion.tag,
  author: discussion.author,
  title: discussion.title,
  body: discussion.body,
  replies: discussion.replies,
  timeLabel: discussion.timeLabel,
  user: discussion.user,
  createdAt: discussion.createdAt,
  updatedAt: discussion.updatedAt
});

exports.getDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find({}).sort({ createdAt: -1 });
    res.json({ success: true, discussions: discussions.map(discussionToResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch discussions.' });
  }
};

exports.getDiscussionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid discussion ID.' });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found.' });
    }
    res.json({ success: true, discussion: discussionToResponse(discussion) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch discussion.' });
  }
};

exports.createDiscussion = async (req, res) => {
  try {
    const { title, body, tag } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required.' });
    }

    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.name : 'You';

    const discussion = await Discussion.create({
      tag: tag || 'Discussion',
      author: userName,
      user: userId,
      title,
      body,
      replies: 0,
      timeLabel: 'Just now'
    });

    res.status(201).json({ success: true, discussion: discussionToResponse(discussion) });
  } catch (error) {
    console.error('Create discussion error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to create discussion.' });
  }
};

exports.updateDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found.' });
    }

    if (discussion.user && req.user && discussion.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own posts.' });
    }

    const { title, body, tag } = req.body;
    if (title) discussion.title = title;
    if (body) discussion.body = body;
    if (tag) discussion.tag = tag;

    await discussion.save();
    res.json({ success: true, discussion: discussionToResponse(discussion) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update discussion.' });
  }
};

exports.deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found.' });
    }

    if (discussion.user && req.user && discussion.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts.' });
    }

    await discussion.deleteOne();
    res.json({ success: true, message: 'Discussion deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete discussion.' });
  }
};
