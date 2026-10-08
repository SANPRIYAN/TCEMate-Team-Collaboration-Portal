const mongoose = require('mongoose');
const Applicant = require('../models/Applicant');
const Interest = require('../models/Interest');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const User = require('../models/User');
const { isProjectExpired, parseFutureDeadline, refreshProjectStatus } = require('../services/projectLifecycle');
const { matchSkills, normalizeSkillList, studentSkillNames } = require('../services/skillService');

const projectToResponse = (project, userSkills, teamMembers) => {
  const response = {
    id: project._id,
    title: project.title,
    description: project.description,
    type: project.type,
    department: project.department,
    year: project.year,
    status: isProjectExpired(project) ? 'closed' : project.status,
    timeLabel: project.timeLabel,
    matchScore: project.matchScore,
    deadline: project.deadline,
    teamSize: project.teamSize,
    requiredSkills: project.requiredSkills || [],
    createdBy: project.createdBy,
    owner: project.createdBy && project.createdBy.name ? {
      id: project.createdBy._id,
      name: project.createdBy.name,
      department: project.createdBy.department,
      year: project.createdBy.year,
      skills: studentSkillNames(project.createdBy.skills)
    } : undefined,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
  if (Array.isArray(userSkills)) {
    response.match = matchSkills(response.requiredSkills, userSkills);
  }
  if (teamMembers) response.teamMembers = teamMembers;
  return response;
};

const validateRequiredSkills = (skills) => {
  if (!Array.isArray(skills) || skills.some((skill) => typeof skill !== 'string')) return null;
  const trimmed = skills.map((skill) => skill.trim()).filter(Boolean);
  const normalized = normalizeSkillList(trimmed);
  return normalized && normalized.length > 0 && normalized.length <= 20 ? normalized : null;
};

const isAuthorizedToManage = (project, user) => (
  user.role === 'admin' || String(project.createdBy && project.createdBy._id || project.createdBy) === String(user.id)
);

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({}).populate('createdBy', 'name department year skills').sort({ createdAt: -1 });
    const user = req.user ? await User.findById(req.user.id).select('skills') : null;
    await Promise.all(projects.map((project) => refreshProjectStatus(project)));
    res.json({
      success: true,
      projects: projects.map((project) => projectToResponse(project, user ? studentSkillNames(user.skills) : undefined))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch projects.' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }
    const project = await Project.findById(req.params.id).populate('createdBy', 'name department year skills');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    await refreshProjectStatus(project);

    const accepted = await Applicant.find({ project: project._id, status: 'accepted' })
      .populate('user', 'name department year skills')
      .sort({ createdAt: 1 });
    const teamMembers = [{
      id: project.createdBy && project.createdBy._id,
      name: project.createdBy && project.createdBy.name,
      role: 'Lead',
      department: project.createdBy && project.createdBy.department,
      year: project.createdBy && project.createdBy.year,
      skills: studentSkillNames(project.createdBy && project.createdBy.skills)
    }].concat(accepted.map((applicant) => ({
      id: applicant.user && applicant.user._id || applicant.user,
      name: applicant.user && applicant.user.name || applicant.name,
      role: 'Member',
      department: applicant.user && applicant.user.department || applicant.department,
      year: applicant.user && applicant.user.year || applicant.year,
      skills: studentSkillNames(applicant.user && applicant.user.skills)
    })));
    const user = req.user ? await User.findById(req.user.id).select('skills') : null;
    return res.json({
      success: true,
      project: projectToResponse(project, user ? studentSkillNames(user.skills) : undefined, teamMembers)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch project.' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, type, department, year, deadline, teamSize, requiredSkills } = req.body;
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedDescription = typeof description === 'string' ? description.trim() : '';
    const normalizedSkills = validateRequiredSkills(requiredSkills);
    const parsedDeadline = parseFutureDeadline(deadline);
    const size = Number(teamSize);

    if (normalizedTitle.length < 3 || normalizedTitle.length > 120 || normalizedDescription.length < 10 || normalizedDescription.length > 5000) {
      return res.status(400).json({ success: false, message: 'Enter a title (3-120 characters) and description (10-5000 characters).' });
    }
    if (!parsedDeadline) return res.status(400).json({ success: false, message: 'Deadline must be a valid future date.' });
    if (!Array.isArray(requiredSkills) || !requiredSkills.some((skill) => typeof skill === 'string' && skill.trim())) {
      return res.status(400).json({ success: false, message: 'At least one required skill is required.' });
    }
    if (!normalizedSkills) return res.status(400).json({ success: false, message: 'Required skills must contain between 1 and 20 valid skills.' });
    if (!Number.isInteger(size) || size < 1 || size > 10) {
      return res.status(400).json({ success: false, message: 'Team size must be between 1 and 10.' });
    }

    const project = await Project.create({
      title: normalizedTitle,
      description: normalizedDescription,
      type: typeof type === 'string' ? type.trim().slice(0, 60) || 'Project' : 'Project',
      department: typeof department === 'string' ? department.trim().slice(0, 100) : 'Information Technology',
      year: typeof year === 'string' ? year.trim().slice(0, 30) : '3rd Year',
      status: 'open',
      timeLabel: 'Just now',
      matchScore: 0,
      deadline: parsedDeadline,
      requiredSkills: normalizedSkills,
      teamSize: size,
      createdBy: req.user.id
    });
    await project.populate('createdBy', 'name department year skills');
    return res.status(201).json({ success: true, project: projectToResponse(project) });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Project data failed backend validation.' });
    return res.status(500).json({ success: false, message: 'Unable to create project.' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (!isAuthorizedToManage(project, req.user)) return res.status(403).json({ success: false, message: 'Only the project owner or an administrator can manage this project.' });
    await refreshProjectStatus(project);

    if (req.body.status !== undefined && req.body.status !== 'closed') {
      return res.status(400).json({ success: false, message: 'Projects may only be closed, not reopened through this endpoint.' });
    }
    const updates = ['title', 'description', 'type', 'department', 'year'];
    for (const field of updates) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== 'string' || !req.body[field].trim()) {
          return res.status(400).json({ success: false, message: `${field} must be a non-empty string.` });
        }
        project[field] = req.body[field].trim();
      }
    }
    if (req.body.requiredSkills !== undefined) {
      const skills = validateRequiredSkills(req.body.requiredSkills);
      if (!Array.isArray(req.body.requiredSkills) || !req.body.requiredSkills.some((skill) => typeof skill === 'string' && skill.trim())) {
        return res.status(400).json({ success: false, message: 'At least one required skill is required.' });
      }
      if (!skills) return res.status(400).json({ success: false, message: 'Required skills must contain between 1 and 20 valid skills.' });
      project.requiredSkills = skills;
    }
    if (req.body.teamSize !== undefined) {
      const size = Number(req.body.teamSize);
      if (!Number.isInteger(size) || size < 1 || size > 10) return res.status(400).json({ success: false, message: 'Team size must be between 1 and 10.' });
      project.teamSize = size;
    }
    if (req.body.deadline !== undefined) {
      const deadline = parseFutureDeadline(req.body.deadline);
      if (!deadline) return res.status(400).json({ success: false, message: 'Deadline must be a valid future date.' });
      project.deadline = deadline;
    }
    if (req.body.status === 'closed') project.status = 'closed';
    await project.save();
    await project.populate('createdBy', 'name department year skills');
    return res.json({ success: true, project: projectToResponse(project) });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Project data failed backend validation.' });
    return res.status(500).json({ success: false, message: 'Unable to update project.' });
  }
};

exports.deleteProject = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid project ID.' });
  const session = await mongoose.startSession();
  try {
    let deleted = false;
    await session.withTransaction(async () => {
      const project = await Project.findById(req.params.id).session(session);
      if (!project) return;
      if (!isAuthorizedToManage(project, req.user)) {
        throw Object.assign(new Error('Only the project owner or an administrator can delete this project.'), { status: 403 });
      }
      await Applicant.deleteMany({ project: project._id }, { session });
      await Interest.deleteMany({ project: project._id }, { session });
      await Notification.deleteMany({ relatedProject: project._id }, { session });
      await project.deleteOne({ session });
      deleted = true;
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.json({ success: true, message: 'Project and associated applications were removed.' });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: status === 500 ? 'Unable to remove project and associated applications.' : error.message });
  } finally {
    await session.endSession();
  }
};
