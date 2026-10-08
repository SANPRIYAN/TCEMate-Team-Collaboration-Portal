const express = require('express');
const { protect, requireAdmin } = require('../middleware/auth');
const {
  getOverview,
  getStudents,
  getStudentActivity,
  getProjects,
  getInterests,
  getDiscussions,
  setStudentActive,
  deleteStudent
} = require('../controllers/adminController');

const router = express.Router();
router.use(protect, requireAdmin);

router.get('/overview', getOverview);
router.get('/students', getStudents);
router.get('/students/:id', getStudentActivity);
router.patch('/students/:id/status', setStudentActive);
router.delete('/students/:id', deleteStudent);
router.get('/projects', getProjects);
router.get('/interests', getInterests);
router.get('/discussions', getDiscussions);

module.exports = router;
