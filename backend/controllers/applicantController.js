const mongoose = require('mongoose');
const Applicant = require('../models/Applicant');
const Interest = require('../models/Interest');
const Project = require('../models/Project');
const { submitApplication, decideApplication } = require('../services/applicationService');
const { studentSkillNames } = require('../services/skillService');

const applicantToResponse = (applicant) => ({
  id: applicant._id,
  user: applicant.user && applicant.user._id || applicant.user,
  project: applicant.project && applicant.project._id || applicant.project,
  projectDetails: applicant.project && applicant.project.title ? {
    id: applicant.project._id,
    title: applicant.project.title,
    description: applicant.project.description,
    requiredSkills: applicant.project.requiredSkills || [],
    deadline: applicant.project.deadline,
    status: applicant.project.status
  } : undefined,
  name: applicant.user && applicant.user.name || applicant.name,
  regNo: applicant.user && applicant.user.regNo || applicant.regNo,
  department: applicant.user && applicant.user.department || applicant.department,
  year: applicant.user && applicant.user.year || applicant.year,
  skills: applicant.user ? studentSkillNames(applicant.user.skills) : [],
  matchScore: applicant.matchScore,
  status: applicant.status,
  createdAt: applicant.createdAt,
  updatedAt: applicant.updatedAt
});

exports.getApplicants = async (req, res) => {
  try {
    let projectIds;
    if (req.query.mine === 'true') {
      const applicants = await Applicant.find({ user: req.user.id })
        .populate('user', 'name regNo department year skills')
        .populate('project', 'title description requiredSkills deadline status')
        .sort({ createdAt: -1 });
      return res.json({ success: true, applicants: applicants.map(applicantToResponse) });
    }

    if (req.query.project) {
      if (!mongoose.Types.ObjectId.isValid(req.query.project)) return res.status(400).json({ success: false, message: 'Invalid project ID.' });
      const project = await Project.findById(req.query.project).select('createdBy');
      if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
      if (String(project.createdBy) !== String(req.user.id) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only the project owner or an administrator can view applicants.' });
      }
      projectIds = [project._id];
    } else if (req.user.role === 'admin') {
      projectIds = (await Project.find({}).select('_id')).map((project) => project._id);
    } else {
      projectIds = (await Project.find({ createdBy: req.user.id }).select('_id')).map((project) => project._id);
    }

    const applicants = await Applicant.find({ project: { $in: projectIds } })
      .populate('user', 'name regNo department year skills')
      .populate('project', 'title description requiredSkills deadline status')
      .sort({ createdAt: -1 });
    return res.json({ success: true, applicants: applicants.map(applicantToResponse) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch applicants.' });
  }
};

exports.createApplicant = async (req, res) => {
  const { project: projectId } = req.body;
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ success: false, message: 'A valid project ID is required.' });
  }
  if (req.body.status !== undefined) {
    return res.status(400).json({ success: false, message: 'Application status is assigned by the server.' });
  }
  try {
    const applicant = await submitApplication(req.user.id, projectId, req.body);
    await applicant.populate('project', 'title description requiredSkills deadline status');
    return res.status(201).json({ success: true, applicant: applicantToResponse(applicant) });
  } catch (error) {
    const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
    return res.status(status).json({
      success: false,
      message: status === 500 ? 'Unable to create application.' : error.message,
      ...(error.missingSkills ? { missingSkills: error.missingSkills } : {})
    });
  }
};

exports.updateApplicant = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid applicant ID.' });
  if (Object.keys(req.body).some((key) => key !== 'status')) {
    return res.status(400).json({ success: false, message: 'Only application status may be changed.' });
  }
  try {
    const applicant = await decideApplication({ applicantId: req.params.id, actor: req.user, status: req.body.status });
    await applicant.populate('user', 'name regNo department year skills');
    await applicant.populate('project', 'title description requiredSkills deadline status');
    return res.json({ success: true, applicant: applicantToResponse(applicant) });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: status === 500 ? 'Unable to update application.' : error.message });
  }
};

exports.deleteApplicant = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid applicant ID.' });
  const session = await mongoose.startSession();
  try {
    let removed = false;
    await session.withTransaction(async () => {
      const applicant = await Applicant.findById(req.params.id).session(session);
      if (!applicant) return;
      const project = await Project.findById(applicant.project).session(session);
      if (!project) throw Object.assign(new Error('Project not found.'), { status: 404 });
      if (String(project.createdBy) !== String(req.user.id) && req.user.role !== 'admin') {
        throw Object.assign(new Error('Only the project owner or an administrator can remove an application.'), { status: 403 });
      }
      if (applicant.status !== 'pending') throw Object.assign(new Error('Accepted or rejected application history cannot be deleted.'), { status: 409 });
      await Interest.deleteOne({ user: applicant.user, project: applicant.project }, { session });
      await applicant.deleteOne({ session });
      removed = true;
    });
    if (!removed) return res.status(404).json({ success: false, message: 'Applicant not found.' });
    return res.json({ success: true, message: 'Pending application removed.' });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: status === 500 ? 'Unable to remove application.' : error.message });
  } finally {
    await session.endSession();
  }
};
