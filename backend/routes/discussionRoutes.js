const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  voteDiscussion,
  addComment,
  voteComment,
  updateComment,
  deleteComment
} = require('../controllers/discussionController');

router.get('/', getDiscussions);
router.get('/:id', getDiscussionById);
router.post('/', protect, createDiscussion);
router.put('/:id', protect, updateDiscussion);
router.delete('/:id', protect, deleteDiscussion);
router.post('/:id/vote', protect, voteDiscussion);
router.post('/:id/comments', protect, addComment);
router.put('/:id/comments/:commentId', protect, updateComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.post('/:id/comments/:commentId/vote', protect, voteComment);

module.exports = router;

