const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDiscussions, getDiscussionById, createDiscussion, updateDiscussion, deleteDiscussion } = require('../controllers/discussionController');

router.get('/', getDiscussions);
router.get('/:id', getDiscussionById);
router.post('/', protect, createDiscussion);
router.put('/:id', protect, updateDiscussion);
router.delete('/:id', protect, deleteDiscussion);

module.exports = router;
