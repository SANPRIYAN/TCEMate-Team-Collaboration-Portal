const mongoose = require('mongoose');
const Interest = require('../models/Interest');
const Applicant = require('../models/Applicant');
const Discussion = require('../models/Discussion');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const User = require('../models/User');
const { isProjectExpired } = require('../services/projectLifecycle');
const { normalizeSkills } = require('../services/skillService');

const studentFilter = { $or: [{ role: 'student' }, { role: null }] };
const countMap = (rows) => new Map(rows.map((row) => [String(row._id), row.count]));

const studentSummary = (user, projectsCreated, interestsSent) => {
  const skills = normalizeSkills(user.skills, user._id);
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    department: user.department,
    year: user.year,
    section: user.section,
    accountStatus: user.isActive === false ? 'inactive' : 'active',
    skills: skills.map((skill) => skill.name),
    projectsCreated,
    interestsSent,
    createdAt: user.createdAt
  };
};

exports.getOverview = async (req, res) => {
  try {
    const now = new Date();
    const [
      totalStudents,
      activeUsers,
      totalProjects,
      openProjects,
      totalInterests,
    ] = await Promise.all([
      User.countDocuments(studentFilter),
      User.countDocuments({ isActive: { $ne: false } }),
      Project.countDocuments({}),
      Project.countDocuments({
        status: 'open',
        $or: [{ deadline: null }, { deadline: { $gt: now } }]
      }),
      Interest.countDocuments({})
    ]);
    return res.json({
      success: true,
      stats: {
        totalStudents,
        activeUsers,
        totalProjects,
        totalInterests,
        openProjects,
        closedProjects: totalProjects - openProjects
      }
    });
  } catch (error) {
    console.error('Admin overview failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Unable to load platform statistics.' });
  }
};

exports.setStudentActive = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid student ID.' });
  }
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  if (Object.keys(body).length !== 1 || typeof body.isActive !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Provide a boolean account status.' });
  }
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, ...studentFilter },
      { $set: { isActive: body.isActive } },
      { new: true, runValidators: true }
    ).select('_id name isActive');
    if (!user) return res.status(404).json({ success: false, message: 'Student not found.' });
    return res.json({
      success: true,
      student: { id: user._id, name: user.name, accountStatus: user.isActive ? 'active' : 'inactive' }
    });
  } catch (error) {
    console.error('Admin student status update failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Unable to update student account status.' });
  }
};

exports.deleteStudent = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid student ID.' });
  }
  const session = await mongoose.startSession();
  try {
    let deleted = false;
    await session.withTransaction(async () => {
      const student = await User.findOne({ _id: req.params.id, ...studentFilter }).session(session);
      if (!student) return;
      const projectIds = await Project.find({ createdBy: student._id }).distinct('_id').session(session);
      await Applicant.deleteMany({ $or: [{ user: student._id }, { project: { $in: projectIds } }] }, { session });
      await Interest.deleteMany({ $or: [{ user: student._id }, { project: { $in: projectIds } }] }, { session });
      await Notification.deleteMany({
        $or: [{ user: student._id }, { relatedUser: student._id }, { relatedProject: { $in: projectIds } }]
      }, { session });
      await Discussion.deleteMany({ user: student._id }, { session });
      await Project.deleteMany({ _id: { $in: projectIds } }, { session });
      await student.deleteOne({ session });
      deleted = true;
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Student not found.' });
    return res.json({ success: true, message: 'Student account and its associated project activity were removed.' });
  } catch (error) {
    console.error('Admin student deletion failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Unable to delete student and associated activity.' });
  } finally {
    await session.endSession();
  }
};

exports.getStudents = async (req, res) => {
  try {
    const [users, projectCounts, interestCounts] = await Promise.all([
      User.find(studentFilter)
        .select('name email department year section skills isActive createdAt')
        .sort({ name: 1, _id: 1 })
        .lean(),
      Project.aggregate([
        { $group: { _id: '$createdBy', count: { $sum: 1 } } }
      ]),
      Interest.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } }
      ])
    ]);
    const projectsByStudent = countMap(projectCounts);
    const interestsByStudent = countMap(interestCounts);
    return res.json({
      success: true,
      students: users.map((user) => studentSummary(
        user,
        projectsByStudent.get(String(user._id)) || 0,
        interestsByStudent.get(String(user._id)) || 0
      ))
    });
  } catch (error) {
    console.error('Admin student directory failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Unable to load students.' });
  }
};

exports.getStudentActivity = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid student ID.' });
  }
  try {
    const [user, projects, interests] = await Promise.all([
      User.findOne({ _id: req.params.id, ...studentFilter })
        .select('name email department year section skills isActive createdAt')
        .lean(),
      Project.find({ createdBy: req.params.id })
        .select('title description requiredSkills deadline status createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      Interest.find({ user: req.params.id })
        .select('title details status project createdAt')
        .populate({
          path: 'project',
          select: 'title createdBy',
          populate: { path: 'createdBy', select: 'name email' }
        })
        .sort({ createdAt: -1 })
        .lean()
    ]);
    if (!user) return res.status(404).json({ success: false, message: 'Student not found.' });
    const skills = normalizeSkills(user.skills, user._id);
    return res.json({
      success: true,
      student: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        section: user.section,
        accountStatus: user.isActive === false ? 'inactive' : 'active',
        createdAt: user.createdAt,
        skills
      },
      projects: projects.map((project) => ({
        id: project._id,
        title: project.title,
        description: project.description,
        requiredSkills: project.requiredSkills || [],
        deadline: project.deadline,
        status: isProjectExpired(project) ? 'closed' : project.status,
        createdAt: project.createdAt
      })),
      interests: interests.map((interest) => ({
        id: interest._id,
        title: interest.title,
        details: interest.details,
        status: interest.status,
        createdAt: interest.createdAt,
        project: interest.project ? {
          title: interest.project.title,
          owner: interest.project.createdBy ? {
            name: interest.project.createdBy.name,
            email: interest.project.createdBy.email
          } : null
        } : null
      }))
    });
  } catch (error) {
    console.error('Admin student activity failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Unable to load student activity.' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const [projects, interestCounts] = await Promise.all([
      Project.find({})
        .populate('createdBy', 'name email department year')
        .sort({ createdAt: -1 })
        .lean(),
      Interest.aggregate([
        { $group: { _id: '$project', count: { $sum: 1 } } }
      ])
    ]);
    const interestsByProject = countMap(interestCounts);
    return res.json({
      success: true,
      projects: projects.map((project) => ({
        id: project._id,
        title: project.title,
        description: project.description,
        requiredSkills: project.requiredSkills || [],
        deadline: project.deadline,
        status: isProjectExpired(project) ? 'closed' : project.status,
        createdAt: project.createdAt,
        interestsCount: interestsByProject.get(String(project._id)) || 0,
        owner: project.createdBy ? {
          id: project.createdBy._id,
          name: project.createdBy.name,
          email: project.createdBy.email,
          department: project.createdBy.department,
          year: project.createdBy.year
        } : null
      }))
    });
  } catch (error) {
    console.error('Admin project directory failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Unable to load projects.' });
  }
};

exports.getInterests = async (req, res) => {
  try {
    const interests = await Interest.find({})
      .populate('user', 'name email department year section')
      .populate({
        path: 'project',
        select: 'title createdBy',
        populate: { path: 'createdBy', select: 'name email' }
      })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      interests: interests.map((interest) => ({
        id: interest._id,
        title: interest.title,
        details: interest.details,
        status: interest.status,
        createdAt: interest.createdAt,
        student: interest.user ? {
          id: interest.user._id,
          name: interest.user.name,
          email: interest.user.email,
          department: interest.user.department,
          year: interest.user.year,
          section: interest.user.section
        } : null,
        project: interest.project ? {
          id: interest.project._id,
          title: interest.project.title,
          owner: interest.project.createdBy ? {
            name: interest.project.createdBy.name,
            email: interest.project.createdBy.email
          } : null
        } : null
      }))
    });
  } catch (error) {
    console.error('Admin interest directory failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Unable to load interests.' });
  }
};

exports.getDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find({})
      .select('tag author title body replies user createdAt')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, discussions });
  } catch (error) {
    console.error('Admin moderation list failed:', error.name || 'UnknownError');
    return res.status(500).json({ success: false, message: 'Unable to load platform discussions.' });
  }
};
