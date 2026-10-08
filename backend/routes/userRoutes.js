const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCurrentUser, updateCurrentUser, addSkill, updateSkill, deleteSkill } = require('../controllers/userController');

router.get('/me', protect, getCurrentUser);
router.put('/me', protect, updateCurrentUser);
router.post('/me/skills', protect, addSkill);
router.put('/me/skills/:skillId', protect, updateSkill);
router.delete('/me/skills/:skillId', protect, deleteSkill);

module.exports = router;
