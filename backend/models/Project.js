const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, default: 'Project' },
    department: { type: String, default: 'Information Technology' },
    year: { type: String, default: '3rd Year' },
    status: { type: String, lowercase: true, default: 'open', enum: ['open', 'closed'] },
    timeLabel: { type: String, default: 'Just now' },
    matchScore: { type: Number, default: 0 },
    deadline: { type: Date },
    requiredSkills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills) => skills.length >= 1 && skills.length <= 20 && skills.every((skill) => skill.trim()),
        message: 'At least one required skill is required.'
      }
    },
    teamSize: { type: Number, default: 2, min: 1, max: 10 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
