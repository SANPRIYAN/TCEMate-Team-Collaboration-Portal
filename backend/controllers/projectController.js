const Project = require('../models/Project');

const projectToResponse = (project) => ({
  id: project._id,
  title: project.title,
  description: project.description,
  type: project.type,
  department: project.department,
  year: project.year,
  status: project.status,
  timeLabel: project.timeLabel,
  matchScore: project.matchScore,
  deadline: project.deadline,
  teamSize: project.teamSize,
  createdBy: project.createdBy,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt
});

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    res.json({ success: true, projects: projects.map(projectToResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch projects.' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    res.json({ success: true, project: projectToResponse(project) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch project.' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, type, department, year, deadline, teamSize, status } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const project = await Project.create({
      title,
      description,
      type: type || 'Project',
      department: department || 'Information Technology',
      year: year || '3rd Year',
      status: status || 'open',
      timeLabel: 'Just now',
      matchScore: 0,
      deadline: deadline || '',
      teamSize: teamSize || 2,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, project: projectToResponse(project) });
  } catch (error) {
    console.error('Create project error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to create project.' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.createdBy && project.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own listings.' });
    }

    const updates = req.body;
    Object.assign(project, updates);
    await project.save();

    res.json({ success: true, project: projectToResponse(project) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update project.' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.createdBy && project.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own listings.' });
    }

    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete project.' });
  }
};
