const Interest = require('../models/Interest');
const mongoose = require('mongoose');
const Project = require('../models/Project');

const interestToResponse = (interest) => ({
  id: interest._id,
  user: interest.user,
  project: interest.project,
  projectDetails: interest.project && interest.project.title ? {
    id: interest.project._id,
    title: interest.project.title,
    description: interest.project.description
  } : undefined,
  title: interest.title,
  details: interest.details,
  status: interest.status,
  createdAt: interest.createdAt,
  updatedAt: interest.updatedAt
});

exports.getInterests = async (req, res) => {
  try {
    const interests = await Interest.find({ user: req.user.id })
      .populate('project', 'title description')
      .sort({ createdAt: -1 });
    res.json({ success: true, interests: interests.map(interestToResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch interests.' });
  }
};

exports.createInterest = async (req, res) => {
  try {
    const { project: projectId, title, details, status } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ success: false, message: 'Project and interest title are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    const existing = await Interest.findOne({ user: req.user.id, project: projectId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already shown interest in this project.' });
    }

    const interest = await Interest.create({
      user: req.user ? req.user.id : undefined,
      project: projectId,
      title,
      details: details || '',
      status: status || 'pending'
    });

    res.status(201).json({ success: true, interest: interestToResponse(interest) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create interest.' });
  }
};

exports.updateInterest = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid interest ID.' });
    }
    const interest = await Interest.findOne({ _id: req.params.id, user: req.user.id });
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Interest not found.' });
    }

    const { title, details, status } = req.body;
    if (title) interest.title = title;
    if (details !== undefined) interest.details = details;
    if (status) interest.status = status;

    await interest.save();
    res.json({ success: true, interest: interestToResponse(interest) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update interest.' });
  }
};

exports.deleteInterest = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid interest ID.' });
    }
    const interest = await Interest.findOne({ _id: req.params.id, user: req.user.id });
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Interest not found.' });
    }

    await interest.deleteOne();
    res.json({ success: true, message: 'Interest deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete interest.' });
  }
};
