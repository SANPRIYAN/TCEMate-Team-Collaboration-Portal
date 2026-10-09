const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCurrentUser, getUserById, updateCurrentUser, addSkill, updateSkill, deleteSkill } = require('../controllers/userController');

router.get('/me', protect, getCurrentUser);
router.get('/:id', protect, getUserById);
router.put('/me', protect, updateCurrentUser);
router.post('/me/skills', protect, addSkill);
router.put('/me/skills/:skillId', protect, updateSkill);
router.delete('/me/skills/:skillId', protect, deleteSkill);

module.exports = router;

