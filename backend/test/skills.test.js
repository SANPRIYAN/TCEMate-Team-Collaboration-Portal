const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const userController = require('../controllers/userController');

const invoke = async (handler, req) => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; }
  };
  await handler(req, res);
  return result;
};

test('students can add, edit, and remove self-declared skills without review metadata', async (t) => {
  const originalFindById = User.findById;
  const user = {
    _id: '507f1f77bcf86cd799439011',
    role: 'student',
    skills: [],
    saves: 0,
    markModified(path) { assert.equal(path, 'skills'); },
    async save() { this.saves += 1; }
  };
  User.findById = async (id) => {
    assert.equal(id, user._id);
    return user;
  };
  t.after(() => { User.findById = originalFindById; });

  const added = await invoke(userController.addSkill, {
    user: { id: user._id },
    body: { name: ' React ' }
  });
  assert.equal(added.statusCode, 201);
  assert.deepEqual(added.body.skills.map((skill) => skill.name), ['React']);
  assert.equal(Object.hasOwn(user.skills[0], 'status'), false);
  const skillId = added.body.skills[0].id;

  const updated = await invoke(userController.updateSkill, {
    user: { id: user._id },
    params: { skillId },
    body: { name: 'Node.js' }
  });
  assert.equal(updated.statusCode, 200);
  assert.deepEqual(updated.body.skills.map((skill) => skill.name), ['Node.js']);

  const removed = await invoke(userController.deleteSkill, {
    user: { id: user._id },
    params: { skillId }
  });
  assert.equal(removed.statusCode, 200);
  assert.deepEqual(removed.body.skills, []);
  assert.equal(user.saves, 3);
});

test('administrator accounts cannot use the student skill mutation API', async (t) => {
  const originalFindById = User.findById;
  const user = {
    _id: '507f1f77bcf86cd799439011',
    role: 'admin',
    skills: [],
    async save() { assert.fail('admin skill mutation must not save'); }
  };
  User.findById = async () => user;
  t.after(() => { User.findById = originalFindById; });

  const result = await invoke(userController.addSkill, {
    user: { id: user._id },
    body: { name: 'React' }
  });
  assert.equal(result.statusCode, 403);
});
