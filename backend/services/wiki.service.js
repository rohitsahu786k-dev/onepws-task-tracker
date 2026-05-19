const slugify = require('slugify');
const Counter = require('../models/Counter');
const WikiArticle = require('../models/WikiArticle');
const WikiVersion = require('../models/WikiVersion');
const WikiCategory = require('../models/WikiCategory');

let sanitizeHtml;
try {
  sanitizeHtml = require('sanitize-html');
} catch {
  sanitizeHtml = null;
}

const htmlSanitizeOptions = sanitizeHtml
  ? {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt'],
        '*': ['id', 'class'],
      },
    }
  : {};

function cleanHtml(content = '') {
  if (!sanitizeHtml) return String(content).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  return sanitizeHtml(content, htmlSanitizeOptions);
}

const DEFAULT_WIKI_CATEGORIES = [
  { name: 'Getting Started', slug: 'getting-started', icon: 'rocket', order: 1 },
  { name: 'Marketing SOPs', slug: 'marketing-sops', icon: 'book-open', order: 2 },
  { name: 'Task Process', slug: 'task-process', icon: 'check-square', order: 3 },
  { name: 'Project Process', slug: 'project-process', icon: 'folder-kanban', order: 4 },
  { name: 'SLA Guidelines', slug: 'sla-guidelines', icon: 'clock', order: 5 },
  { name: 'MOM Guidelines', slug: 'mom-guidelines', icon: 'clipboard-list', order: 6 },
  { name: 'Brand Guidelines', slug: 'brand-guidelines', icon: 'palette', order: 7 },
  { name: 'Design Guidelines', slug: 'design-guidelines', icon: 'paintbrush', order: 8 },
  { name: 'Content Guidelines', slug: 'content-guidelines', icon: 'type', order: 9 },
  { name: 'Campaign Guidelines', slug: 'campaign-guidelines', icon: 'megaphone', order: 10 },
  { name: 'Budget & Expenses', slug: 'budget-expenses', icon: 'wallet', order: 11 },
  { name: 'Timesheets', slug: 'timesheets', icon: 'timer', order: 12 },
  { name: 'Media Library', slug: 'media-library', icon: 'image', order: 13 },
  { name: 'FAQs', slug: 'faqs', icon: 'help-circle', order: 99 },
  { name: 'Templates', slug: 'templates', icon: 'copy', order: 100 },
  { name: 'Troubleshooting', slug: 'troubleshooting', icon: 'wrench', order: 101 },
];

async function seedDefaultWikiCategories(workspace, user) {
  const existing = await WikiCategory.countDocuments({ workspace });
  if (existing) return [];
  return WikiCategory.insertMany(DEFAULT_WIKI_CATEGORIES.map((item) => ({
    ...item,
    workspace,
    isSystemCategory: true,
    isActive: true,
    createdBy: user,
  })));
}

async function generateArticleNumber(workspace) {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace, key: `wiki_article_number_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `WIKI-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

async function generateUniqueSlug({ workspace, title, excludeId }) {
  const base = slugify(title || 'wiki-article', { lower: true, strict: true }) || 'wiki-article';
  let slug = base;
  let index = 1;
  const query = { workspace, slug };
  if (excludeId) query._id = { $ne: excludeId };
  while (await WikiArticle.exists(query)) {
    index += 1;
    slug = `${base}-${index}`;
    query.slug = slug;
  }
  return slug;
}

function extractToc(html = '') {
  const toc = [];
  const re = /<h([123])[^>]*id=["']?([^"'>\s]+)?["']?[^>]*>(.*?)<\/h\1>/gi;
  let match;
  let order = 0;
  while ((match = re.exec(html))) {
    order += 1;
    const title = match[3].replace(/<[^>]+>/g, '').trim();
    toc.push({ id: match[2] || slugify(title, { lower: true, strict: true }), title, level: Number(match[1]), order });
  }
  return toc;
}

async function createVersion({ article, user, changeSummary = 'Version saved', changeType = 'minor_edit' }) {
  const latest = await WikiVersion.findOne({ workspace: article.workspace, article: article._id }).sort({ versionNumber: -1 }).select('versionNumber');
  const versionNumber = (latest?.versionNumber || 0) + 1;
  const version = await WikiVersion.create({
    workspace: article.workspace,
    article: article._id,
    versionNumber,
    title: article.title,
    summary: article.summary,
    content: article.content,
    contentJson: article.contentJson,
    plainText: article.plainText,
    tags: article.tags,
    changeSummary,
    changeType,
    statusAtVersion: article.status,
    createdBy: user,
  });
  article.version = versionNumber;
  await article.save();
  return version;
}

function articleAccessQuery(req) {
  const workspace = req.params.wid || req.body.workspace || req.query.workspace;
  const base = { workspace, isDeleted: { $ne: true } };
  if (['super_admin', 'owner', 'admin'].includes(req.workspaceRole)) return base;
  const userId = req.user?._id;
  return {
    ...base,
    $or: [
      { createdBy: userId },
      { owner: userId },
      { reviewers: userId },
      { 'allowedUsers.user': userId },
      { visibility: 'workspace', status: 'published' },
      { visibility: 'department', status: 'published', allowedDepartments: req.workspaceDepartment },
    ],
  };
}

function canEdit(article, req) {
  if (['super_admin', 'owner', 'admin'].includes(req.workspaceRole)) return true;
  const userId = req.user?._id?.toString();
  if (article.createdBy?.toString() === userId || article.owner?.toString() === userId) return true;
  return article.allowedUsers?.some((item) => item.user?.toString() === userId && ['edit', 'approve'].includes(item.permission));
}

function canApprove(article, req) {
  if (['super_admin', 'owner', 'admin'].includes(req.workspaceRole)) return true;
  const userId = req.user?._id?.toString();
  return article.reviewers?.some((id) => id.toString() === userId) || article.approval?.approvers?.some((item) => item.user?.toString() === userId);
}

module.exports = {
  DEFAULT_WIKI_CATEGORIES,
  cleanHtml,
  htmlSanitizeOptions,
  seedDefaultWikiCategories,
  generateArticleNumber,
  generateUniqueSlug,
  extractToc,
  createVersion,
  articleAccessQuery,
  canEdit,
  canApprove,
};
