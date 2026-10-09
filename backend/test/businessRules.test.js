const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const Applicant = require('../models/Applicant');
const User = require('../models/User');
const Project = require('../models/Project');
const projectController = require('../controllers/projectController');
const applicationService = require('../services/applicationService');
const { protect, requireAdmin } = require('../middleware/auth');
const { isProjectExpired, parseFutureDeadline } = require('../services/projectLifecycle');
const { matchSkills, normalizeSkills, normalizeSkillList, studentSkillNames } = require('../services/skillService');
const { isValidTceStudentEmail, normalizeEmail } = require('../services/emailValidation');

const invoke = async (handler, req) => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; }
  };
  await handler(req, res);
  return result;
};

test('skill names normalize whitespace and duplicates without case sensitivity', () => {
  assert.deepEqual(normalizeSkillList([' React ', 'react', 'Node   .js']), ['React', 'Node .js']);
});

test('all student-declared skills satisfy matching regardless of legacy review metadata', () => {
  const skills = normalizeSkills(['React', { name: 'Node.js', status: 'verified' }], 'user-1');
  assert.equal(skills[0].status, undefined);
  assert.equal(skills[1].status, 'verified');
  assert.deepEqual(studentSkillNames(skills), ['React', 'Node.js']);
  assert.deepEqual(matchSkills(['React', 'Node.js'], studentSkillNames(skills)), {
    eligible: true,
    matchedSkills: ['React', 'Node.js'],
    missingSkills: [],
    matchPercentage: 100
  });
});

test('matching requires every required skill and reports a useful percentage', () => {
  assert.deepEqual(matchSkills(['React', 'Node.js', 'MongoDB', 'Git'], ['REACT', 'node.js', 'mongodb']), {
    eligible: false,
    matchedSkills: ['React', 'Node.js', 'MongoDB'],
    missingSkills: ['Git'],
    matchPercentage: 75
  });
  assert.equal(matchSkills(['React', 'Node.js'], ['react', 'NODE.JS']).eligible, true);
  assert.equal(matchSkills([], ['React']).eligible, false);
});

test('project creation rejects missing or blank required skills at the API boundary', async () => {
  const invalidSkillValues = [undefined, null, [], [''], ['   ', '']];
  for (const requiredSkills of invalidSkillValues) {
    const body = {
      title: 'Bike Rental App',
      description: 'A useful application for renting bikes.',
      deadline: '2099-12-31',
      teamSize: 3
    };
    if (requiredSkills !== undefined) body.requiredSkills = requiredSkills;
    const result = await invoke(projectController.createProject, { body, user: { id: 'student-id' } });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.message, 'At least one required skill is required.');
  }
});

test('project creation trims and deduplicates required skills before persistence', async (t) => {
  const originalCreate = Project.create;
  let stored;
  const project = {
    _id: 'project-id',
    createdBy: { _id: 'student-id', name: 'Project Owner' },
    async populate() { return this; }
  };
  Project.create = async (data) => {
    stored = data;
    Object.assign(project, data);
    return project;
  };
  t.after(() => { Project.create = originalCreate; });

  const result = await invoke(projectController.createProject, {
    body: {
      title: 'Bike Rental App',
      description: 'A useful application for renting bikes.',
      deadline: '2099-12-31',
      teamSize: 3,
      requiredSkills: [' React ', 'react', 'MongoDB']
    },
    user: { id: 'student-id' }
  });

  assert.equal(result.statusCode, 201);
  assert.deepEqual(stored.requiredSkills, ['React', 'MongoDB']);
  assert.deepEqual(result.body.project.requiredSkills, ['React', 'MongoDB']);
});

test('date-only deadlines remain open through the selected UTC date and reject expired dates', () => {
  const deadline = parseFutureDeadline('2099-12-31', new Date('2099-12-30T00:00:00.000Z'));
  assert.equal(deadline.toISOString(), '2099-12-31T23:59:59.999Z');
  assert.equal(parseFutureDeadline('2020-01-01', new Date('2025-01-01T00:00:00.000Z')), null);
  assert.equal(parseFutureDeadline('2025-02-30', new Date('2025-01-01T00:00:00.000Z')), null);
});

test('a project expires at the exact deadline instant', () => {
  const deadline = new Date('2025-01-01T12:00:00.000Z');
  assert.equal(isProjectExpired({ deadline }, new Date('2025-01-01T11:59:59.999Z')), false);
  assert.equal(isProjectExpired({ deadline }, deadline), true);
});

test('application submission closes and rejects a project at or after its deadline', async (t) => {
  const originalStartSession = require('mongoose').startSession;
  const originalFindById = Project.findById;
  let saved = false;
  const project = {
    _id: 'project-id',
    status: 'open',
    deadline: new Date(Date.now() - 1000),
    async save() { saved = true; }
  };
  require('mongoose').startSession = async () => ({
    async withTransaction(callback) { await callback(); },
    async endSession() {}
  });
  Project.findById = () => ({
    session() { return Promise.resolve(project); }
  });
  t.after(() => {
    require('mongoose').startSession = originalStartSession;
    Project.findById = originalFindById;
  });

  await assert.rejects(
    applicationService.submitApplication('student-id', 'project-id'),
    (error) => error.status === 409 && /project is closed/i.test(error.message)
  );
  assert.equal(project.status, 'closed');
  assert.equal(saved, true);
});

test('admin middleware distinguishes unauthenticated, student, and administrator requests', () => {
  const call = (user) => {
    const result = { status: null, body: null, passed: false };
    const res = {
      status(code) { result.status = code; return this; },
      json(body) { result.body = body; return this; }
    };
    requireAdmin({ user }, res, () => { result.passed = true; });
    return result;
  };
  assert.equal(call(undefined).status, 401);
  assert.equal(call({ role: 'student' }).status, 403);
  assert.equal(call({ role: 'admin' }).passed, true);
});

test('authenticated routes accept active users without verified-email metadata', async (t) => {
  const originalFindById = User.findById;
  const originalSecret = process.env.JWT_SECRET;
  const userId = '507f1f77bcf86cd799439011';
  process.env.JWT_SECRET = 'test-only-secret-with-more-than-thirty-two-characters';
  User.findById = () => ({
    async select() {
      return {
        _id: { toString: () => userId },
        name: 'New Student',
        email: 'new@student.tce.edu',
        role: 'student',
        isEmailVerified: false,
        isActive: true
      };
    }
  });
  t.after(() => {
    User.findById = originalFindById;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const req = {
    headers: {
      authorization: `Bearer ${jwt.sign({ id: userId, role: 'student' }, process.env.JWT_SECRET)}`
    }
  };
  const result = { statusCode: null, passed: false };
  await protect(req, {
    status(code) { result.statusCode = code; return this; },
    json() { return this; }
  }, () => { result.passed = true; });

  assert.equal(result.passed, true);
  assert.equal(result.statusCode, null);
  assert.equal(req.user.role, 'student');
});

test('admin authorization is granted only when the authenticated database role is admin', async (t) => {
  const originalFindById = User.findById;
  const originalSecret = process.env.JWT_SECRET;
  const userId = '507f1f77bcf86cd799439012';
  process.env.JWT_SECRET = 'test-only-secret-with-more-than-thirty-two-characters';
  let databaseRole = 'student';
  User.findById = () => ({
    async select() {
      return {
        _id: { toString: () => userId },
        name: 'Test Account',
        email: 'test@example.invalid',
        role: databaseRole,
        isActive: true
      };
    }
  });
  t.after(() => {
    User.findById = originalFindById;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const authorize = async (role) => {
    const req = {
      headers: {
        authorization: `Bearer ${jwt.sign({ id: userId, role }, process.env.JWT_SECRET)}`
      }
    };
    const result = { statusCode: null, passed: false };
    const res = {
      status(code) { result.statusCode = code; return this; },
      json() { return this; }
    };
    await protect(req, res, () => requireAdmin(req, res, () => { result.passed = true; }));
    return result;
  };

  databaseRole = 'student';
  const studentResult = await authorize('student');
  assert.equal(studentResult.statusCode, 403);
  assert.equal(studentResult.passed, false);

  databaseRole = 'admin';
  const adminResult = await authorize('admin');
  assert.equal(adminResult.statusCode, null);
  assert.equal(adminResult.passed, true);
});

test('registration role defaults to student and applicant status defaults to pending', () => {
  assert.equal(User.schema.path('role').defaultValue, 'student');
  assert.equal(new Applicant().status, 'pending');
  assert.deepEqual(Applicant.schema.path('status').enumValues, ['pending', 'accepted', 'rejected']);
});

test('applicant records enforce uniqueness for project/user pairs', () => {
  const uniquePairIndex = Applicant.schema.indexes().find(([fields, options]) => (
    fields.project === 1 && fields.user === 1 && options.unique
  ));
  assert.ok(uniquePairIndex);
});

test('student email validation normalizes case and whitespace and requires the exact student domain', () => {
  assert.equal(isValidTceStudentEmail('  Student123@STUDENT.TCE.EDU  '), true);
  assert.equal(isValidTceStudentEmail('abc@student.tce.edu'), true);
  assert.equal(isValidTceStudentEmail('abc@gmail.com'), false);
  assert.equal(isValidTceStudentEmail('abc@tce.edu'), false);
  assert.equal(isValidTceStudentEmail('abc@student.gmail.com'), false);
  assert.equal(isValidTceStudentEmail('a b@student.tce.edu'), false);
  assert.equal(normalizeEmail(' Student@STUDENT.TCE.EDU '), 'student@student.tce.edu');
});

test('password hashing and comparison use bcrypt-compatible hashes', async () => {
  const password = 'Test-Only-Password1!';
  const hash = await User.hashPassword(password);
  const user = new User({
    name: 'Test Student',
    email: 'hash-test@student.tce.edu',
    regNo: 'TEST12345',
    phone: '9876543210',
    password: hash
  });
  assert.match(hash, /^\$2[ab]\$10\$/);
  assert.equal(await user.comparePassword(password), true);
  assert.equal(await user.comparePassword('Incorrect-Test-Password1!'), false);
});

test('users default to unverified students and the role index permits at most one admin', () => {
  assert.equal(User.schema.path('isEmailVerified').defaultValue, false);
  assert.equal(User.schema.path('isActive').defaultValue, true);
  const singleAdminIndex = User.schema.indexes().find(([fields, options]) => (
    fields.role === 1 && options.unique && options.partialFilterExpression.role === 'admin'
  ));
  assert.ok(singleAdminIndex);
});

test('student registration creates an active student without sending an OTP', async (t) => {
  const controller = require('../controllers/authController');
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  let created;

  t.after(() => {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  });

  User.findOne = async () => null;
  User.create = async (fields) => {
    created = fields;
    return { _id: 'student-id', ...fields };
  };
  const result = { statusCode: 200, body: null };
  await controller.register({
    body: {
      fullName: 'Test Student',
      email: 'student@student.tce.edu',
      regNo: '12345678',
      phone: '9876543210',
      password: 'Valid-Test-Password1!'
    }
  }, {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; }
  });
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.success, true);
  assert.equal(result.body.user.role, 'student');
  assert.equal(result.body.user.email, 'student@student.tce.edu');
  assert.equal(result.body.challengeId, undefined);
  assert.equal(created.isActive, true);
  assert.equal(created.isEmailVerified, false);
});

test('active student and admin password logins issue JWTs regardless of email verification metadata', async (t) => {
  const controller = require('../controllers/authController');
  const originalFindOne = User.findOne;
  const originalSecret = process.env.JWT_SECRET;
  const userId = '507f1f77bcf86cd799439011';
  process.env.JWT_SECRET = 'test-only-secret-with-more-than-thirty-two-characters';

  t.after(() => {
    User.findOne = originalFindOne;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  for (const role of ['student', 'admin']) {
    const email = role === 'student' ? 'new@student.tce.edu' : 'authorized@example.com';
    User.findOne = async () => ({
      _id: userId,
      name: 'Test User',
      email,
      role,
      isEmailVerified: false,
      isActive: true,
      async comparePassword(password) { return password === 'Valid-Test-Password1!'; }
    });
    const result = { statusCode: 200, body: null };
    await controller[role === 'admin' ? 'adminLogin' : 'login']({
      body: { email, password: 'Valid-Test-Password1!' }
    }, {
      status(code) { result.statusCode = code; return this; },
      json(body) { result.body = body; return this; }
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.success, true);
    assert.equal(typeof result.body.token, 'string');
    assert.equal(result.body.user.role, role);
    assert.equal(jwt.verify(result.body.token, process.env.JWT_SECRET).role, role);

    User.findOne = async () => ({
      _id: userId,
      name: 'Test User',
      email,
      role,
      isActive: true,
      async comparePassword(password) { return password === 'Valid-Test-Password1!'; }
    });
    const wrongPassword = { statusCode: 200, body: null };
    await controller[role === 'admin' ? 'adminLogin' : 'login']({
      body: { email, password: 'Wrong-Test-Password1!' }
    }, {
      status(code) { wrongPassword.statusCode = code; return this; },
      json(body) { wrongPassword.body = body; return this; }
    });
    assert.equal(wrongPassword.statusCode, 401);
    assert.equal(wrongPassword.body.success, false);
  }

  User.findOne = async () => ({
    _id: userId,
    email: 'inactive@student.tce.edu',
    role: 'student',
    isActive: false,
    async comparePassword() { return true; }
  });
  const inactiveResult = { statusCode: 200, body: null };
  await controller.login({
    body: { email: 'inactive@student.tce.edu', password: 'Valid-Test-Password1!' }
  }, {
    status(code) { inactiveResult.statusCode = code; return this; },
    json(body) { inactiveResult.body = body; return this; }
  });
  assert.equal(inactiveResult.statusCode, 403);
});

test('auth API exposes no OTP generation, resend, or verification routes', () => {
  const router = require('../routes/authRoutes');
  const paths = router.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);
  assert.ok(paths.includes('/register'));
  assert.ok(paths.includes('/login'));
  assert.ok(paths.includes('/admin/setup'));
  assert.ok(paths.includes('/forgot-password'));
  assert.equal(paths.some((path) => /otp|resend|setup\/verify/.test(path)), false);
});

test('first-admin setup requires the configured email and setup secret', async (t) => {
  const controller = require('../controllers/authController');
  const originalSetupEmail = process.env.ADMIN_SETUP_EMAIL;
  const originalSetupSecret = process.env.ADMIN_SETUP_SECRET;
  const originalExists = User.exists;
  const originalHashPassword = User.hashPassword;
  const originalCreateWithHash = User.createWithPasswordHash;

  t.after(() => {
    User.exists = originalExists;
    User.hashPassword = originalHashPassword;
    User.createWithPasswordHash = originalCreateWithHash;
    if (originalSetupEmail === undefined) delete process.env.ADMIN_SETUP_EMAIL;
    else process.env.ADMIN_SETUP_EMAIL = originalSetupEmail;
    if (originalSetupSecret === undefined) delete process.env.ADMIN_SETUP_SECRET;
    else process.env.ADMIN_SETUP_SECRET = originalSetupSecret;
  });

  User.exists = async () => null;
  delete process.env.ADMIN_SETUP_EMAIL;
  delete process.env.ADMIN_SETUP_SECRET;
  const statusResult = { statusCode: 200, body: null };
  await controller.adminSetupStatus({}, {
    status(code) { statusResult.statusCode = code; return this; },
    json(body) { statusResult.body = body; return this; }
  });
  assert.equal(statusResult.statusCode, 200);
  assert.equal(statusResult.body.available, false);

  process.env.ADMIN_SETUP_EMAIL = 'authorized@example.com';
  process.env.ADMIN_SETUP_SECRET = 'a-test-admin-setup-secret-longer-than-32-characters';
  User.exists = async (filter) => filter.role === 'admin' ? null : null;
  const availableResult = { statusCode: 200, body: null };
  await controller.adminSetupStatus({}, {
    status(code) { availableResult.statusCode = code; return this; },
    json(body) { availableResult.body = body; return this; }
  });
  assert.equal(availableResult.statusCode, 200);
  assert.equal(availableResult.body.available, true);

  User.exists = async () => {
    throw new Error('Unauthorized setup email must be rejected before checking or modifying users.');
  };
  const setupResult = { statusCode: 200, body: null };
  await controller.startAdminSetup({
    body: {
      fullName: 'Unauthorized Admin',
      email: 'attacker@example.com',
      password: 'Valid-Test-Password1!',
      confirmPassword: 'Valid-Test-Password1!',
      setupSecret: process.env.ADMIN_SETUP_SECRET
    }
  }, {
    status(code) { setupResult.statusCode = code; return this; },
    json(body) { setupResult.body = body; return this; }
  });
  assert.equal(setupResult.statusCode, 403);
  assert.equal(setupResult.body.success, false);

  const keyRejected = { statusCode: 200, body: null };
  await controller.startAdminSetup({
    body: {
      fullName: 'Authorized Admin',
      email: 'authorized@example.com',
      password: 'Valid-Test-Password1!',
      confirmPassword: 'Valid-Test-Password1!',
      setupSecret: 'incorrect-test-secret-value'
    }
  }, {
    status(code) { keyRejected.statusCode = code; return this; },
    json(body) { keyRejected.body = body; return this; }
  });
  assert.equal(keyRejected.statusCode, 403);

  const user = {
    _id: 'admin-id',
    name: 'Authorized Admin',
    email: 'authorized@example.com',
    role: 'admin',
    isActive: true
  };
  User.exists = async (filter) => filter.role === 'admin' ? null : null;
  User.hashPassword = async () => 'hashed-test-password';
  User.createWithPasswordHash = async (fields) => {
    assert.deepEqual(fields, {
      name: 'Authorized Admin',
      email: 'authorized@example.com',
      passwordHash: 'hashed-test-password',
      role: 'admin',
      isEmailVerified: false,
      isActive: true
    });
    return user;
  };
  const created = { statusCode: 200, body: null };
  await controller.startAdminSetup({
    body: {
      fullName: 'Authorized Admin',
      email: 'authorized@example.com',
      password: 'Valid-Test-Password1!',
      confirmPassword: 'Valid-Test-Password1!',
      setupSecret: process.env.ADMIN_SETUP_SECRET
    }
  }, {
    status(code) { created.statusCode = code; return this; },
    json(body) { created.body = body; return this; }
  });
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.success, true);
  assert.equal(created.body.user.role, 'admin');
  assert.equal(created.body.challengeId, undefined);

  User.exists = async (filter) => filter.role === 'admin' ? { _id: 'existing-admin' } : null;
  User.createWithPasswordHash = async () => {
    throw new Error('Setup must not create a second administrator.');
  };
  const secondAdmin = { statusCode: 200, body: null };
  await controller.startAdminSetup({
    body: {
      fullName: 'Another Admin',
      email: 'authorized@example.com',
      password: 'Valid-Test-Password1!',
      confirmPassword: 'Valid-Test-Password1!',
      setupSecret: process.env.ADMIN_SETUP_SECRET
    }
  }, {
    status(code) { secondAdmin.statusCode = code; return this; },
    json(body) { secondAdmin.body = body; return this; }
  });
  assert.equal(secondAdmin.statusCode, 409);
  assert.equal(secondAdmin.body.success, false);
});

test('password reset using unique passkey updates user password with PATCH operation', async (t) => {
  const User = require('../models/User');
  const controller = require('../controllers/authController');

  let updatedFilter = null;
  let updatedDoc = null;
  t.after(() => {
    User.findOne = originalUserFindOne;
    User.findOneAndUpdate = originalUserFindOneAndUpdate;
  });
  const originalUserFindOne = User.findOne;
  const originalUserFindOneAndUpdate = User.findOneAndUpdate;

  User.findOne = async (filter) => {
    if (filter.email === 'student@student.tce.edu') {
      return {
        _id: 'user-passkey-123',
        email: 'student@student.tce.edu',
        regNo: '2023IT045',
        passkey: '123'
      };
    }
    return null;
  };

  User.findOneAndUpdate = async (filter, update) => {
    updatedFilter = filter;
    updatedDoc = update;
    return {
      _id: 'user-passkey-123',
      email: 'student@student.tce.edu'
    };
  };

  const res = { statusCode: 200, body: null };
  await controller.resetPasswordWithPasskey({
    body: {
      email: 'student@student.tce.edu',
      passkey: '123',
      newPassword: 'New-Valid-Password123!'
    }
  }, {
    status(code) { res.statusCode = code; return this; },
    json(body) { res.body = body; return this; }
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(updatedFilter._id, 'user-passkey-123');
  assert.equal(typeof updatedDoc.$set.password, 'string');
  assert.equal(updatedDoc.$set.passkey, '123');
});
