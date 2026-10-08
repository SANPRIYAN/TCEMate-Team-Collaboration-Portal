const mongoose = require('mongoose');
const Applicant = require('../models/Applicant');
const Interest = require('../models/Interest');
const { submitApplication } = require('../services/applicationService');

const interestToResponse = (interest) => ({
  id: interest._id,
  user: interest.user,
  project: interest.project && interest.project._id || interest.project,
  projectDetails: interest.project && interest.project.title ? {
    id: interest.project._id,
    title: interest.project.title,
    description: interest.project.description,
    requiredSkills: interest.project.requiredSkills || [],
    status: interest.project.status,
    deadline: interest.project.deadline
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
      .populate('project', 'title description requiredSkills status deadline')
      .sort({ createdAt: -1 });
    return res.json({ success: true, interests: interests.map(interestToResponse) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch interests.' });
  }
};

exports.createInterest = async (req, res) => {
  const { project: projectId } = req.body;
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ success: false, message: 'A valid project ID is required.' });
  }
  if (req.body.status !== undefined) {
    return res.status(400).json({ success: false, message: 'Application status is assigned by the server.' });
  }
  try {
    await submitApplication(req.user.id, projectId, req.body);
    const interest = await Interest.findOne({ user: req.user.id, project: projectId })
      .populate('project', 'title description requiredSkills status deadline');
    return res.status(201).json({ success: true, interest: interestToResponse(interest) });
  } catch (error) {
    const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
    return res.status(status).json({
      success: false,
      message: status === 500 ? 'Unable to create interest.' : error.message,
      ...(error.missingSkills ? { missingSkills: error.missingSkills } : {})
    });
  }
};

exports.updateInterest = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid interest ID.' });
  if (Object.keys(req.body).some((key) => key !== 'details')) {
    return res.status(400).json({ success: false, message: 'Only application details may be changed.' });
  }
  try {
    const interest = await Interest.findOne({ _id: req.params.id, user: req.user.id });
    if (!interest) return res.status(404).json({ success: false, message: 'Interest not found.' });
    if (interest.status !== 'pending') return res.status(409).json({ success: false, message: 'Only pending interests may be edited.' });
    if (req.body.details !== undefined) {
      if (typeof req.body.details !== 'string' || req.body.details.length > 2000) return res.status(400).json({ success: false, message: 'Details must be a string of 2000 characters or fewer.' });
      interest.details = req.body.details.trim();
    }
    await interest.save();
    await interest.populate('project', 'title description requiredSkills status deadline');
    return res.json({ success: true, interest: interestToResponse(interest) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update interest.' });
  }
};

exports.deleteInterest = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid interest ID.' });
  const session = await mongoose.startSession();
  try {
    let removed = false;
    await session.withTransaction(async () => {
      const interest = await Interest.findOne({ _id: req.params.id, user: req.user.id }).session(session);
      if (!interest) return;
      if (interest.status !== 'pending') throw Object.assign(new Error('Only pending interests may be withdrawn.'), { status: 409 });
      await Applicant.deleteOne({ user: req.user.id, project: interest.project }, { session });
      await interest.deleteOne({ session });
      removed = true;
    });
    if (!removed) return res.status(404).json({ success: false, message: 'Interest not found.' });
    return res.json({ success: true, message: 'Pending interest withdrawn.' });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: status === 500 ? 'Unable to withdraw interest.' : error.message });
  } finally {
    await session.endSession();
  }
};
