const slugify = require('slugify');
const Counter = require('../models/Counter');
const Project = require('../models/Project');

async function nextSequence(workspace, key) {
  const counter = await Counter.findOneAndUpdate(
    { workspace, key },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence;
}

async function generateProjectNumber(workspace) {
  const year = new Date().getFullYear();
  const seq = await nextSequence(workspace, `project_number_${year}`);
  return `PRJ-${year}-${String(seq).padStart(4, '0')}`;
}

async function generateProjectCode({ workspace, title }) {
  const base = slugify(title || 'project', { lower: false, strict: true }).slice(0, 16).toUpperCase() || 'PROJECT';
  let code = base;
  let index = 1;
  while (await Project.exists({ workspace, projectCode: code })) {
    index += 1;
    code = `${base}-${index}`;
  }
  return code;
}

module.exports = { generateProjectNumber, generateProjectCode };
