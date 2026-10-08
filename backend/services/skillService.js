const crypto = require('crypto');

const normalizeSkillName = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const skillKey = (value) => normalizeSkillName(value).toLocaleLowerCase('en-US');

const normalizeSkills = (skills, userId) => {
  const seen = new Set();
  return (Array.isArray(skills) ? skills : []).reduce((result, skill) => {
    const source = typeof skill === 'string' ? { name: skill } : skill;
    const name = normalizeSkillName(source && source.name);
    const key = skillKey(name);
    if (!name || !key || seen.has(key)) return result;
    seen.add(key);
    const status = ['pending', 'verified', 'rejected'].includes(source.status) ? source.status : null;
    const id = source.id || crypto.createHash('sha256')
      .update(`${userId || ''}:${key}`)
      .digest('hex')
      .slice(0, 24);
    const normalized = {
      id,
      name
    };
    if (status) normalized.status = status;
    if (source.requestedAt) normalized.requestedAt = source.requestedAt;
    if (source.reviewedAt) normalized.reviewedAt = source.reviewedAt;
    result.push(normalized);
    return result;
  }, []);
};

const normalizeSkillList = (skills) => {
  if (!Array.isArray(skills)) return null;
  const normalized = [];
  const seen = new Set();
  for (const value of skills) {
    const name = normalizeSkillName(value);
    if (!name || name.length > 50) return null;
    const key = skillKey(name);
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push(name);
    }
  }
  return normalized;
};

const studentSkillNames = (skills) => normalizeSkills(skills)
  .map((skill) => skill.name);

const matchSkills = (requiredSkills, candidateSkills) => {
  const required = normalizeSkillList(requiredSkills) || [];
  const candidate = new Map(
    (normalizeSkillList(candidateSkills) || []).map((name) => [skillKey(name), name])
  );
  const matchedSkills = required.filter((name) => candidate.has(skillKey(name)));
  const missingSkills = required.filter((name) => !candidate.has(skillKey(name)));
  return {
    eligible: required.length > 0 && missingSkills.length === 0,
    matchedSkills,
    missingSkills,
    matchPercentage: required.length ? Math.round((matchedSkills.length / required.length) * 100) : 0
  };
};

module.exports = {
  normalizeSkillName,
  skillKey,
  normalizeSkills,
  normalizeSkillList,
  studentSkillNames,
  matchSkills
};
