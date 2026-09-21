const Applicant = require('../models/Applicant');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Interest = require('../models/Interest');
const { createNotification } = require('../services/notificationService');

const applicantToResponse = (applicant) => ({
  id: applicant._id,
  user: applicant.user,
  project: applicant.project,
  projectDetails: applicant.project && applicant.project.title ? {
    id: applicant.project._id,
    title: applicant.project.title,
    description: applicant.project.description
  } : undefined,
  name: applicant.name,
  regNo: applicant.regNo,
  department: applicant.department,
  year: applicant.year,
  skills: applicant.skills,
  matchScore: applicant.matchScore,
  status: applicant.status,
  createdAt: applicant.createdAt,
  updatedAt: applicant.updatedAt
});

exports.getApplicants = async (req, res) => {
  try {
    if (req.query.mine === 'true') {
      const applicants = await Applicant.find({ user: req.user.id })
        .populate('project', 'title description')
        .sort({ createdAt: -1 });
      return res.json({ success: true, applicants: applicants.map(applicantToResponse) });
    }

    let projectIds;
    if (req.query.project) {
      if (!mongoose.Types.ObjectId.isValid(req.query.project)) {
        return res.status(400).json({ success: false, message: 'Invalid project ID.' });
      }
      const project = await Project.findById(req.query.project).select('createdBy');
      if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
      if (!project.createdBy || project.createdBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Only the project owner can view applicants.' });
      }
      projectIds = [project._id];
    } else {
      const ownedProjects = await Project.find({ createdBy: req.user.id }).select('_id');
      projectIds = ownedProjects.map((project) => project._id);
    }
    const applicants = await Applicant.find({ project: { $in: projectIds } })
      .populate('project', 'title description')
      .sort({ createdAt: -1 });
    res.json({ success: true, applicants: applicants.map(applicantToResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch applicants.' });
  }
};

exports.createApplicant = async (req, res) => {
  try {
    const { project: projectId, name, regNo, department, year, skills, matchScore } = req.body;

    if (!projectId || !name || !regNo) {
      return res.status(400).json({ success: false, message: 'Project, applicant name, and regNo are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.createdBy && project.createdBy.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot apply to your own project.' });
    }
    const existing = await Applicant.findOne({ project: projectId, user: req.user.id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied to this project.' });
    }

    const applicant = await Applicant.create({
      user: req.user ? req.user.id : undefined,
      project: projectId,
      name,
      regNo,
      department: department || 'Information Technology',
      year: year || '3rd Year',
      skills: skills || [],
      matchScore: matchScore || 0,
      status: 'pending'
    });

    await Interest.create({
      user: req.user.id,
      project: projectId,
      title: project.title,
      details: project.description,
      status: 'pending'
    });
    await createNotification({
      user: project.createdBy,
      title: 'New project application',
      message: `${name} applied to your project: ${project.title}.`,
      icon: '👋'
    });

    res.status(201).json({ success: true, applicant: applicantToResponse(await applicant.populate('project', 'title description')) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create applicant.' });
  }
};

exports.updateApplicant = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid applicant ID.' });
    }
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found.' });
    }

    const project = applicant.project ? await Project.findById(applicant.project) : null;
    if (!project || !project.createdBy || project.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can manage applicants.' });
    }

    const { status, matchScore, skills } = req.body;
    if (status && !['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid applicant status.' });
    }
    const previousStatus = applicant.status;
    if (status) applicant.status = status;
    if (matchScore !== undefined) applicant.matchScore = matchScore;
    if (skills) applicant.skills = skills;

    await applicant.save();
    if (status && status !== previousStatus && ['accepted', 'rejected'].includes(status)) {
      await Interest.findOneAndUpdate({ user: applicant.user, project: applicant.project }, { status });
      await createNotification({
        user: applicant.user,
        title: status === 'accepted' ? 'Application accepted' : 'Application rejected',
        message: `Your application for ${project.title} was ${status}.`,
        icon: status === 'accepted' ? '✅' : 'ℹ️'
      });
    }
    res.json({ success: true, applicant: applicantToResponse(await applicant.populate('project', 'title description')) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update applicant.' });
  }
};

exports.deleteApplicant = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid applicant ID.' });
    }
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found.' });
    }

    const project = applicant.project ? await Project.findById(applicant.project) : null;
    if (!project || !project.createdBy || project.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete applicants.' });
    }

    await applicant.deleteOne();
    res.json({ success: true, message: 'Applicant deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete applicant.' });
  }
};
