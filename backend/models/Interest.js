const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    title: { type: String, required: true },
    details: { type: String, default: '' },
    status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'rejected'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

interestSchema.index({ project: 1, user: 1 }, { unique: true, partialFilterExpression: { project: { $type: 'objectId' }, user: { $type: 'objectId' } } });

module.exports = mongoose.model('Interest', interestSchema);
