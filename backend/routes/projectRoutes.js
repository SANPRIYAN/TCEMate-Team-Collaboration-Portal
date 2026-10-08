const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth');
const { getProjects, getProjectById, createProject, updateProject, deleteProject } = require('../controllers/projectController');

router.get('/', optionalProtect, getProjects);
router.get('/:id', optionalProtect, getProjectById);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;
