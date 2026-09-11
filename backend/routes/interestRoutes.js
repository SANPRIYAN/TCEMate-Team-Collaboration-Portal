const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getInterests, createInterest, updateInterest, deleteInterest } = require('../controllers/interestController');

router.get('/', protect, getInterests);
router.post('/', protect, createInterest);
router.put('/:id', protect, updateInterest);
router.delete('/:id', protect, deleteInterest);

module.exports = router;
