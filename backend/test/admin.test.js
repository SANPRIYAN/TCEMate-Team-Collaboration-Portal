const test = require('node:test');
const assert = require('node:assert/strict');
const Interest = require('../models/Interest');
const Project = require('../models/Project');
const User = require('../models/User');
const adminController = require('../controllers/adminController');

const invoke = async (handler, req = {}) => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    }
  };
  await handler(req, res);
  return result;
};

test('admin overview returns database counts including deadline-aware open projects', async (t) => {
  const originals = {
    userCount: User.countDocuments,
    projectCount: Project.countDocuments,
    interestCount: Interest.countDocuments,
    aggregate: User.aggregate
  };
  t.after(() => {
    User.countDocuments = originals.userCount;
    Project.countDocuments = originals.projectCount;
    Interest.countDocuments = originals.interestCount;
    User.aggregate = originals.aggregate;
  });
  User.countDocuments = async (filter) => {
    assert.ok(
      filter.isActive || (filter.$or && filter.$or.some((item) => item.role === 'student')),
      'expected student filter or active-user filter'
    );
    return 12;
  };
  Project.countDocuments = async (filter) => {
    if (filter.status === 'open') {
      assert.ok(filter.$or.some((deadline) => deadline.deadline && deadline.deadline.$gt instanceof Date));
      return 7;
    }
    return 10;
  };
  Interest.countDocuments = async () => 31;
  User.aggregate = async () => [{ count: 3 }];

  const result = await invoke(adminController.getOverview);
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body.stats, {
    totalStudents: 12,
    activeUsers: 12,
    totalProjects: 10,
    totalInterests: 31,
    openProjects: 7,
    closedProjects: 3
  });
});

test('admin student directory returns activity counts without sensitive account fields', async (t) => {
  const originals = {
    find: User.find,
    projectAggregate: Project.aggregate,
    interestAggregate: Interest.aggregate
  };
  t.after(() => {
    User.find = originals.find;
    Project.aggregate = originals.projectAggregate;
    Interest.aggregate = originals.interestAggregate;
  });
  const studentId = '507f1f77bcf86cd799439011';
  User.find = (filter) => {
    assert.deepEqual(filter, { $or: [{ role: 'student' }, { role: null }] });
    return {
      select(fields) {
        assert.equal(fields.includes('password'), false);
        return this;
      },
      sort() {
        return this;
      },
      async lean() {
        return [{
          _id: studentId,
          name: 'Test Student',
          email: 'student@student.tce.edu',
          department: 'Information Technology',
          year: '3rd Year',
          section: 'A',
          isActive: true,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          skills: [
            { id: 'skill-1', name: 'React', status: 'verified' },
            { id: 'skill-2', name: 'MongoDB', status: 'pending' }
          ],
          password: 'must-not-be-returned',
          passwordResetTokenHash: 'must-not-be-returned'
        }];
      }
    };
  };
  Project.aggregate = async () => [{ _id: studentId, count: 2 }];
  Interest.aggregate = async () => [{ _id: studentId, count: 4 }];

  const result = await invoke(adminController.getStudents);
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body.students, [{
    id: studentId,
    name: 'Test Student',
    email: 'student@student.tce.edu',
    department: 'Information Technology',
    year: '3rd Year',
    section: 'A',
    accountStatus: 'active',
    skills: ['React', 'MongoDB'],
    projectsCreated: 2,
    interestsSent: 4,
    createdAt: new Date('2025-01-01T00:00:00.000Z')
  }]);
  assert.equal(JSON.stringify(result.body).includes('must-not-be-returned'), false);
});

test('admin routes require authentication and administrator authorization before handlers', () => {
  const router = require('../routes/adminRoutes');
  assert.equal(router.stack[0].name, 'authenticate');
  assert.equal(router.stack[1].name, 'requireAdmin');
  const paths = router.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);
  assert.deepEqual(paths, [
    '/overview',
    '/students',
    '/students/:id',
    '/students/:id/status',
    '/students/:id',
    '/projects',
    '/interests',
    '/discussions'
  ]);
});
