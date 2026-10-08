const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    regNo: { type: String, required() { return this.role === 'student'; }, unique: true, sparse: true, trim: true },
    phone: { type: String, required() { return this.role === 'student'; }, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    verificationEmailSentAt: { type: Date, select: false },
    department: { type: String, default: 'Information Technology' },
    year: { type: String, default: '3rd Year' },
    section: { type: String, default: 'Section A' },
    bio: { type: String, default: '' },
    skills: [{ type: mongoose.Schema.Types.Mixed }],
    projects: [{ type: String }],
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    preferences: {
      hackathon: { type: Boolean, default: true },
      internship: { type: Boolean, default: true }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'admin' },
    name: 'uniq_single_admin'
  }
);

userSchema.statics.hashPassword = (password) => bcrypt.hash(password, 10);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (this.$locals.passwordIsHashed) {
    this.$locals.passwordIsHashed = false;
    return next();
  }
  this.password = await this.constructor.hashPassword(this.password);
  next();
});

userSchema.statics.createWithPasswordHash = async function (data, session) {
  const user = new this(data);
  user.password = data.passwordHash;
  user.$locals.passwordIsHashed = true;
  await user.save(session ? { session } : undefined);
  return user;
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
