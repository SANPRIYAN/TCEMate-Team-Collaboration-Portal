const Applicant = require('../models/Applicant');

const applicantToResponse = (applicant) => ({
  id: applicant._id,
  user: applicant.user,
  project: applicant.project,
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
    const applicants = await Applicant.find({}).sort({ createdAt: -1 });
    res.json({ success: true, applicants: applicants.map(applicantToResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch applicants.' });
  }
};

exports.createApplicant = async (req, res) => {
  try {
    const { name, regNo, department, year, skills, matchScore, status } = req.body;

    if (!name || !regNo) {
      return res.status(400).json({ success: false, message: 'Applicant name and regNo are required.' });
    }

    const applicant = await Applicant.create({
      user: req.user ? req.user.id : undefined,
      name,
      regNo,
      department: department || 'Information Technology',
      year: year || '3rd Year',
      skills: skills || [],
      matchScore: matchScore || 0,
      status: status || 'pending'
    });

    res.status(201).json({ success: true, applicant: applicantToResponse(applicant) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create applicant.' });
  }
};

exports.updateApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found.' });
    }

    const { status, matchScore, skills } = req.body;
    if (status) applicant.status = status;
    if (matchScore !== undefined) applicant.matchScore = matchScore;
    if (skills) applicant.skills = skills;

    await applicant.save();
    res.json({ success: true, applicant: applicantToResponse(applicant) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update applicant.' });
  }
};

exports.deleteApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found.' });
    }

    await applicant.deleteOne();
    res.json({ success: true, message: 'Applicant deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete applicant.' });
  }
};
