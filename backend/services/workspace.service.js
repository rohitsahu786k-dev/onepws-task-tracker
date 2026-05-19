const slugify = require('slugify');
const Workspace = require('../models/Workspace');

const DEFAULT_ALLOWED_MODULES = {
  dashboard: true,
  projects: true,
  tasks: true,
  tracker: true,
  calendar: true,
  reports: true,
  media: true,
  mom: true,
  meetings: true,
  budget: false,
  expenses: false,
  sla: true,
  intake: true,
  notes: true,
  wiki: true,
  vendors: false,
  campaigns: false,
  contentCalendar: false,
  timesheets: false,
  approvals: false,
  settings: true
};

const MODULE_DEPENDENCIES = {
  sla: ['tasks'],
  mom: ['meetings'],
  expenses: ['budget'],
  intake: ['tasks'],
  contentCalendar: ['calendar', 'tasks'],
  timesheets: ['tasks'],
  approvals: ['tasks']
};

async function generateUniqueSlug(name) {
  const base = slugify(name || 'workspace', { lower: true, strict: true }) || 'workspace';
  let slug = base;
  let index = 1;
  while (await Workspace.exists({ slug })) {
    index += 1;
    slug = `${base}-${index}`;
  }
  return slug;
}

function getDefaultAllowedModules() {
  return { ...DEFAULT_ALLOWED_MODULES };
}

function validateModuleDependencies(allowedModules = {}) {
  const warnings = [];
  for (const [moduleKey, dependencies] of Object.entries(MODULE_DEPENDENCIES)) {
    if (!allowedModules[moduleKey]) continue;
    dependencies.forEach((dependency) => {
      if (allowedModules[dependency] === false) warnings.push(`${moduleKey} requires ${dependency}`);
    });
  }
  return warnings;
}

module.exports = { DEFAULT_ALLOWED_MODULES, MODULE_DEPENDENCIES, generateUniqueSlug, getDefaultAllowedModules, validateModuleDependencies };
