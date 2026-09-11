const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    name: { type: String, required: true },
    regNo: { type: String, required: true },
    department: { type: String, default: 'Information Technology' },
    year: { type: String, default: '3rd Year' },
    skills: [{ type: String }],
    matchScore: { type: Number, default: 0 },
    status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'rejected'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Applicant', applicantSchema);
