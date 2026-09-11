const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    regNo: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    department: { type: String, default: 'Information Technology' },
    year: { type: String, default: '3rd Year' },
    section: { type: String, default: 'Section A' },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    projects: [{ type: String }],
    preferences: {
      hackathon: { type: Boolean, default: true },
      internship: { type: Boolean, default: true }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
