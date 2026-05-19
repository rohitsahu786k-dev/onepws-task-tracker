const slugify = require('slugify');
const NoteVersion = require('../models/NoteVersion');

let sanitizeHtml;
try {
  sanitizeHtml = require('sanitize-html');
} catch {
  sanitizeHtml = null;
}

function slugifyTitle(title) {
  return slugify(title || 'note', { lower: true, strict: true });
}

function sanitizeContent(content = '') {
  if (!sanitizeHtml) {
    return String(content).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'span', 'u']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt'],
      span: ['style'],
    },
  });
}

async function createVersion({ note, user, changeSummary = 'Version saved' }) {
  const latest = await NoteVersion.findOne({ workspace: note.workspace, note: note._id }).sort({ versionNumber: -1 }).select('versionNumber');
  const versionNumber = (latest?.versionNumber || 0) + 1;
  const version = await NoteVersion.create({
    workspace: note.workspace,
    note: note._id,
    versionNumber,
    title: note.title,
    content: note.content,
    contentJson: note.contentJson,
    plainText: note.plainText,
    changeSummary,
    createdBy: user,
  });
  note.version = versionNumber;
  await note.save();
  return version;
}

function noteAccessQuery(req) {
  const workspace = req.params.wid || req.query.workspace || req.body.workspace;
  const userId = req.user?._id;
  const base = { workspace, isDeleted: { $ne: true } };
  if (!workspace) delete base.workspace;
  if (['super_admin', 'owner', 'admin'].includes(req.workspaceRole)) return base;
  return {
    ...base,
    $or: [
      { createdBy: userId },
      { visibility: 'workspace' },
      { 'sharedWith.user': userId },
      { 'sharedDepartments.department': req.workspaceDepartment },
    ],
  };
}

function canEdit(note, req) {
  if (['super_admin', 'owner', 'admin'].includes(req.workspaceRole)) return true;
  const userId = req.user?._id?.toString();
  if (note.createdBy?.toString() === userId) return true;
  return note.sharedWith?.some((item) => item.user?.toString() === userId && item.permission === 'edit');
}

module.exports = {
  slugifyTitle,
  sanitizeContent,
  createVersion,
  noteAccessQuery,
  canEdit,
};
