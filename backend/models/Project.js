const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, default: 'Project' },
    department: { type: String, default: 'Information Technology' },
    year: { type: String, default: '3rd Year' },
    status: { type: String, default: 'open', enum: ['open', 'closed'] },
    timeLabel: { type: String, default: 'Just now' },
    matchScore: { type: Number, default: 0 },
    deadline: { type: String },
    teamSize: { type: Number, default: 2 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
