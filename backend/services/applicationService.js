const mongoose = require('mongoose');
const Applicant = require('../models/Applicant');
const Interest = require('../models/Interest');
const Project = require('../models/Project');
const User = require('../models/User');
const { createNotification } = require('./notificationService');
const { isProjectExpired, refreshProjectStatus } = require('./projectLifecycle');
const { matchSkills, normalizeSkills, studentSkillNames } = require('./skillService');

const submitApplication = async (userId, projectId, details = {}) => {
  const session = await mongoose.startSession();
  let createdApplicant;
  let blocked;
  try {
    await session.withTransaction(async () => {
      const project = await Project.findById(projectId).session(session);
      if (!project) throw Object.assign(new Error('Project not found.'), { status: 404 });
      await refreshProjectStatus(project, new Date(), session);
      if (project.status !== 'open' || isProjectExpired(project)) {
        blocked = Object.assign(new Error('This project is closed and no longer accepts applications.'), { status: 409 });
        return;
      }
      const acceptedCount = await Applicant.countDocuments({ project: project._id, status: 'accepted' }).session(session);
      if (acceptedCount + 1 >= project.teamSize) {
        throw Object.assign(new Error('This project has reached its team capacity.'), { status: 409 });
      }
      if (String(project.createdBy) === String(userId)) {
        throw Object.assign(new Error('You cannot apply to your own project.'), { status: 403 });
      }

      const user = await User.findById(userId).session(session);
      if (!user) throw Object.assign(new Error('User not found.'), { status: 401 });
      user.skills = normalizeSkills(user.skills, user._id);
      const studentSkills = studentSkillNames(user.skills);
      const match = matchSkills(project.requiredSkills, studentSkills);
      if (!match.eligible) {
        throw Object.assign(new Error('You are not eligible for this project because you are missing required skills.'), {
          status: 400,
          missingSkills: match.missingSkills
        });
      }

      const existing = await Applicant.findOne({ project: project._id, user: user._id }).session(session);
      if (existing) throw Object.assign(new Error('You have already shown interest in this project.'), { status: 409 });

      const applicant = new Applicant({
        user: user._id,
        project: project._id,
        name: user.name,
        regNo: user.regNo,
        department: user.department,
        year: user.year,
        skills: studentSkills,
        matchScore: match.matchPercentage,
        status: 'pending'
      });
      await applicant.save({ session });
      const interest = new Interest({
        user: user._id,
        project: project._id,
        title: project.title,
        details: String(details.details || '').trim(),
        status: 'pending'
      });
      await interest.save({ session });
      await createNotification({
        user: project.createdBy,
        title: 'New project application',
        message: `${user.name} has expressed interest in your project ${project.title}.`,
        type: 'interest',
        relatedProject: project._id,
        relatedUser: user._id,
        session
      });
      createdApplicant = applicant;
    });
    if (blocked) throw blocked;
    return createdApplicant;
  } catch (error) {
    if (error.code === 11000) {
      throw Object.assign(new Error('You have already shown interest in this project.'), { status: 409 });
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

const decideApplication = async ({ applicantId, actor, status }) => {
  if (!['accepted', 'rejected'].includes(status)) {
    throw Object.assign(new Error('Status must be accepted or rejected.'), { status: 400 });
  }
  const session = await mongoose.startSession();
  let updated;
  let blocked;
  try {
    await session.withTransaction(async () => {
      const applicant = await Applicant.findById(applicantId).session(session);
      if (!applicant) throw Object.assign(new Error('Applicant not found.'), { status: 404 });
      const project = await Project.findById(applicant.project).session(session);
      if (!project) throw Object.assign(new Error('Project not found.'), { status: 404 });
      const isOwner = String(project.createdBy) === String(actor.id);
      if (!isOwner && actor.role !== 'admin') {
        throw Object.assign(new Error('Only the project owner or an administrator can manage applicants.'), { status: 403 });
      }
      await refreshProjectStatus(project, new Date(), session);
      if (project.status !== 'open' || isProjectExpired(project)) {
        blocked = Object.assign(new Error('Closed projects cannot change team membership.'), { status: 409 });
        return;
      }
      if (applicant.status !== 'pending') {
        throw Object.assign(new Error('Only pending applications can be decided.'), { status: 409 });
      }
      if (status === 'accepted') {
        const acceptedCount = await Applicant.countDocuments({ project: project._id, status: 'accepted' }).session(session);
        if (acceptedCount + 2 > project.teamSize) {
          throw Object.assign(new Error('This project has reached its team capacity.'), { status: 409 });
        }
        if (acceptedCount + 2 === project.teamSize) {
          project.status = 'closed';
          await project.save({ session });
        }
      }
      applicant.status = status;
      await applicant.save({ session });
      await Interest.findOneAndUpdate(
        { user: applicant.user, project: applicant.project },
        { $set: { status } },
        { new: true, runValidators: true, session }
      );
      await createNotification({
        user: applicant.user,
        title: status === 'accepted' ? 'Application accepted' : 'Application rejected',
        message: `Your application for ${project.title} was ${status}.`,
        type: status,
        relatedProject: project._id,
        relatedUser: actor.id,
        session
      });
      updated = applicant;
    });
    if (blocked) throw blocked;
    return updated;
  } finally {
    await session.endSession();
  }
};

module.exports = { submitApplication, decideApplication };
