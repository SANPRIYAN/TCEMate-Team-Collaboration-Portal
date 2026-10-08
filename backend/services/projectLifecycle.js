const isProjectExpired = (project, now = new Date()) => {
  if (!project || !project.deadline) return false;
  const deadline = new Date(project.deadline);
  return !Number.isNaN(deadline.getTime()) && now.getTime() >= deadline.getTime();
};

const parseFutureDeadline = (value, now = new Date()) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  let deadline;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    deadline = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    if (deadline.getUTCFullYear() !== year || deadline.getUTCMonth() !== month - 1 || deadline.getUTCDate() !== day) return null;
  } else {
    deadline = new Date(value);
  }
  return !Number.isNaN(deadline.getTime()) && deadline > now ? deadline : null;
};

const refreshProjectStatus = async (project, now = new Date(), session) => {
  if (project.status === 'open' && isProjectExpired(project, now)) {
    project.status = 'closed';
    await project.save(session ? { session } : undefined);
  }
  return project;
};

module.exports = { isProjectExpired, parseFutureDeadline, refreshProjectStatus };
