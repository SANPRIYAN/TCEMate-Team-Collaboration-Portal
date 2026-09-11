const Interest = require('../models/Interest');

const interestToResponse = (interest) => ({
  id: interest._id,
  user: interest.user,
  title: interest.title,
  details: interest.details,
  status: interest.status,
  createdAt: interest.createdAt,
  updatedAt: interest.updatedAt
});

exports.getInterests = async (req, res) => {
  try {
    const interests = await Interest.find({}).sort({ createdAt: -1 });
    res.json({ success: true, interests: interests.map(interestToResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch interests.' });
  }
};

exports.createInterest = async (req, res) => {
  try {
    const { title, details, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Interest title is required.' });
    }

    const interest = await Interest.create({
      user: req.user ? req.user.id : undefined,
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
    const interest = await Interest.findById(req.params.id);
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
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Interest not found.' });
    }

    await interest.deleteOne();
    res.json({ success: true, message: 'Interest deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete interest.' });
  }
};
