const Discussion = require('../models/Discussion');
const mongoose = require('mongoose');

const commentToResponse = (comment, currentUserId) => {
  const voters = comment.voters || [];
  const userVoteObj = currentUserId ? voters.find((v) => String(v.user) === String(currentUserId)) : null;
  const userVote = userVoteObj ? userVoteObj.vote : 0;
  return {
    id: comment._id,
    user: comment.user ? comment.user.toString() : null,
    author: comment.author || 'Anonymous',
    text: comment.text,
    parentId: comment.parentId ? comment.parentId.toString() : null,
    upvotes: comment.upvotes || 0,
    downvotes: comment.downvotes || 0,
    score: (comment.upvotes || 0) - (comment.downvotes || 0),
    userVote: userVote,
    createdAt: comment.createdAt
  };
};

const discussionToResponse = (discussion, currentUserId) => {
  const voters = discussion.voters || [];
  const userVoteObj = currentUserId ? voters.find((v) => String(v.user) === String(currentUserId)) : null;
  const userVote = userVoteObj ? userVoteObj.vote : 0;
  const comments = (discussion.comments || []).map((c) => commentToResponse(c, currentUserId));
  return {
    id: discussion._id,
    tag: discussion.tag,
    author: discussion.author,
    title: discussion.title,
    body: discussion.body,
    upvotes: discussion.upvotes || 0,
    downvotes: discussion.downvotes || 0,
    score: (discussion.upvotes || 0) - (discussion.downvotes || 0),
    userVote: userVote,
    replies: comments.length,
    comments: comments,
    timeLabel: discussion.timeLabel,
    user: discussion.user,
    createdAt: discussion.createdAt,
    updatedAt: discussion.updatedAt
  };
};

exports.getDiscussions = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const discussions = await Discussion.find({}).sort({ createdAt: -1 });
    res.json({ success: true, discussions: discussions.map((d) => discussionToResponse(d, currentUserId)) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch discussions.' });
  }
};

exports.getDiscussionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid discussion ID.' });
    }
    const currentUserId = req.user ? req.user.id : null;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found.' });
    }
    res.json({ success: true, discussion: discussionToResponse(discussion, currentUserId) });
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
      upvotes: 0,
      downvotes: 0,
      voters: [],
      comments: [],
      replies: 0,
      timeLabel: 'Just now'
    });

    res.status(201).json({ success: true, discussion: discussionToResponse(discussion, userId) });
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

    if ((!discussion.user || discussion.user.toString() !== req.user.id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only update your own posts.' });
    }

    const { title, body, tag } = req.body;
    if (title) discussion.title = title;
    if (body) discussion.body = body;
    if (tag) discussion.tag = tag;

    await discussion.save();
    res.json({ success: true, discussion: discussionToResponse(discussion, req.user.id) });
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

    if ((!discussion.user || discussion.user.toString() !== req.user.id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts.' });
    }

    await discussion.deleteOne();
    res.json({ success: true, message: 'Discussion deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete discussion.' });
  }
};

exports.voteDiscussion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid discussion ID.' });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found.' });

    const dir = req.body.dir === 1 ? 1 : (req.body.dir === -1 ? -1 : 0);
    const userId = req.user.id;

    discussion.voters = discussion.voters || [];
    let voter = discussion.voters.find((v) => String(v.user) === String(userId));
    if (!voter) {
      if (dir !== 0) {
        discussion.voters.push({ user: userId, vote: dir });
      }
    } else {
      if (voter.vote === dir || dir === 0) {
        discussion.voters = discussion.voters.filter((v) => String(v.user) !== String(userId));
      } else {
        voter.vote = dir;
      }
    }

    discussion.upvotes = discussion.voters.filter((v) => v.vote === 1).length;
    discussion.downvotes = discussion.voters.filter((v) => v.vote === -1).length;

    await discussion.save();
    return res.json({ success: true, discussion: discussionToResponse(discussion, req.user.id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to vote on discussion.' });
  }
};

exports.addComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid discussion ID.' });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found.' });

    const { text, parentId } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    let parentObjId = null;
    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ success: false, message: 'Invalid parent comment ID.' });
      }
      const parentComment = discussion.comments.id(parentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, message: 'Parent comment not found.' });
      }
      parentObjId = new mongoose.Types.ObjectId(parentId);
    }

    const userName = req.user ? req.user.name : 'Anonymous';
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      user: req.user.id,
      author: userName,
      text: text.trim(),
      parentId: parentObjId,
      upvotes: 0,
      downvotes: 0,
      voters: [],
      createdAt: new Date()
    };

    discussion.comments.push(newComment);
    discussion.replies = discussion.comments.length;
    await discussion.save();

    return res.status(201).json({ success: true, discussion: discussionToResponse(discussion, req.user.id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to add comment.' });
  }
};

exports.voteComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID.' });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found.' });

    const comment = discussion.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const dir = req.body.dir === 1 ? 1 : (req.body.dir === -1 ? -1 : 0);
    const userId = req.user.id;

    comment.voters = comment.voters || [];
    let voter = comment.voters.find((v) => String(v.user) === String(userId));
    if (!voter) {
      if (dir !== 0) {
        comment.voters.push({ user: userId, vote: dir });
      }
    } else {
      if (voter.vote === dir || dir === 0) {
        comment.voters = comment.voters.filter((v) => String(v.user) !== String(userId));
      } else {
        voter.vote = dir;
      }
    }

    comment.upvotes = comment.voters.filter((v) => v.vote === 1).length;
    comment.downvotes = comment.voters.filter((v) => v.vote === -1).length;

    await discussion.save();
    return res.json({ success: true, discussion: discussionToResponse(discussion, req.user.id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to vote on comment.' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid discussion or comment ID.' });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found.' });

    const comment = discussion.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    if (!comment.user || comment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own replies.' });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required.' });
    }

    comment.text = text.trim();
    await discussion.save();

    return res.json({ success: true, discussion: discussionToResponse(discussion, req.user.id), message: 'Reply updated.' });
  } catch (error) {
    console.error('Update comment error:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to update reply.' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid discussion or comment ID.' });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found.' });

    const comment = discussion.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const isAuthor = comment.user && comment.user.toString() === req.user.id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only delete your own replies or as an administrator.' });
    }

    const commentIdStr = req.params.commentId.toString();
    discussion.comments = discussion.comments.filter((c) => (
      c._id.toString() !== commentIdStr && String(c.parentId || '') !== commentIdStr
    ));
    discussion.replies = discussion.comments.length;
    await discussion.save();

    return res.json({ success: true, discussion: discussionToResponse(discussion, req.user.id), message: 'Reply deleted.' });
  } catch (error) {
    console.error('Delete comment error:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to delete reply.' });
  }
};

