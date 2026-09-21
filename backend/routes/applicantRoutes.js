const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getApplicants, createApplicant, updateApplicant, deleteApplicant } = require('../controllers/applicantController');

router.get('/', protect, getApplicants);
router.post('/', protect, createApplicant);
router.put('/:id', protect, updateApplicant);
router.delete('/:id', protect, deleteApplicant);

module.exports = router;
