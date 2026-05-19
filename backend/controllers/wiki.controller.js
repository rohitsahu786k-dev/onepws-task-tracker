const asyncHandler = require('../utils/asyncHandler');
const WikiArticle = require('../models/WikiArticle');
const WikiCategory = require('../models/WikiCategory');
const WikiVersion = require('../models/WikiVersion');
const WikiComment = require('../models/WikiComment');
const WikiFeedback = require('../models/WikiFeedback');
const WikiActivity = require('../models/WikiActivity');
const WikiTemplate = require('../models/WikiTemplate');
const wikiService = require('../services/wiki.service');
const wikiActivityService = require('../services/wikiActivity.service');
const wikiReportService = require('../services/wikiReport.service');
const notificationService = require('../services/notification.service');
const PDFDocument = require('pdfkit');

const workspaceId = (req) => req.params.wid || req.body.workspace || req.query.workspace || req.workspace?._id;
const articleId = (req) => req.params.articleId || req.params.id;

const list = asyncHandler(async (req, res) => {
  const query = wikiService.articleAccessQuery(req);
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = [{ articleNumber: search }, { title: search }, { summary: search }, { plainText: search }, { tags: search }];
  }
  if (req.query.category) query.category = req.query.category;
  if (req.query.articleType) query.articleType = req.query.articleType;
  if (req.query.status) query.status = req.query.status;
  if (req.query.owner) query.owner = req.query.owner;
  if (req.query.pinned === 'true') query.isPinned = true;
  if (req.query.featured === 'true') query.isFeatured = true;
  if (req.query.normal !== 'false') query.status = query.status || { $nin: ['archived', 'deprecated'] };

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const [items, total] = await Promise.all([
    WikiArticle.find(query)
      .populate('category', 'name slug')
      .populate('owner createdBy', 'name firstName lastName email')
      .sort({ isPinned: -1, isFeatured: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    WikiArticle.countDocuments(query),
  ]);
  res.json({ success: true, data: items, articles: items, wikis: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

const create = asyncHandler(async (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' });
  const workspace = workspaceId(req);
  const content = wikiService.cleanHtml(req.body.content || '');
  const articleNumber = await wikiService.generateArticleNumber(workspace);
  const slug = await wikiService.generateUniqueSlug({ workspace, title: req.body.title });
  const article = await WikiArticle.create({
    ...req.body,
    workspace,
    articleNumber,
    slug,
    content,
    plainText: req.body.plainText || content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    tableOfContents: wikiService.extractToc(content),
    visibility: req.body.visibility || 'workspace',
    owner: req.body.owner || req.user?._id,
    reviewers: req.body.reviewers || [],
    approval: {
      required: true,
      status: 'pending',
      approvers: (req.body.reviewers || []).map((user) => ({ user, status: 'pending' })),
    },
    status: 'draft',
    createdBy: req.user?._id,
    updatedBy: req.user?._id,
  });
  await wikiService.createVersion({ article, user: req.user?._id, changeSummary: 'Initial draft', changeType: 'created' });
  await wikiActivityService.log({ workspace, article: article._id, action: 'created', message: `Wiki article ${article.articleNumber} created`, performedBy: req.user?._id });
  if (article.category) await WikiCategory.updateOne({ _id: article.category }, { $inc: { articleCount: 1 } });
  res.status(201).json({ success: true, message: 'Wiki article created successfully', data: article, article, wiki: article });
});

const getById = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) })
    .populate('category', 'name slug')
    .populate('owner createdBy reviewers', 'name firstName lastName email')
    .populate('relatedArticles', 'articleNumber title slug status');
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  article.readCount += 1;
  await article.save();
  res.json({ success: true, data: article, article, wiki: article });
});

const update = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  if (!wikiService.canEdit(article, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this article' });
  if (article.isLocked && !['super_admin', 'owner', 'admin'].includes(req.workspaceRole)) return res.status(400).json({ success: false, message: 'Article is locked for review' });

  const oldValue = article.toObject();
  const patch = { ...req.body };
  if (patch.content !== undefined) {
    patch.content = wikiService.cleanHtml(patch.content);
    patch.plainText = patch.plainText || patch.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    patch.tableOfContents = wikiService.extractToc(patch.content);
  }
  if (patch.title && patch.title !== article.title) patch.slug = await wikiService.generateUniqueSlug({ workspace: article.workspace, title: patch.title, excludeId: article._id });
  if (article.status === 'published' && patch.changeType === 'major_update') patch.status = 'needs_update';
  Object.assign(article, patch, { updatedBy: req.user?._id });
  await article.save();
  await wikiService.createVersion({ article, user: req.user?._id, changeSummary: req.body.changeSummary || 'Article updated', changeType: req.body.changeType || 'minor_edit' });
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'updated', message: 'Wiki article updated', oldValue, newValue: article, performedBy: req.user?._id });
  res.json({ success: true, data: article, article, wiki: article });
});

const remove = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  if (!wikiService.canEdit(article, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this article' });
  article.isDeleted = true;
  article.deletedAt = new Date();
  article.deletedBy = req.user?._id;
  await article.save();
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'deleted', message: 'Wiki article deleted', performedBy: req.user?._id });
  res.json({ success: true, message: 'Wiki article deleted' });
});

const submitReview = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  const reviewers = article.approval?.approvers?.length ? article.approval.approvers.map((item) => item.user) : article.reviewers;
  if (!reviewers?.length) return res.status(400).json({ success: false, message: 'At least one reviewer is required' });
  article.status = 'pending_review';
  article.approval.status = 'pending';
  article.approval.submittedAt = new Date();
  article.approval.approvers = reviewers.map((user) => ({ user, status: 'pending' }));
  article.isLocked = true;
  article.lockedAt = new Date();
  article.lockedBy = req.user?._id;
  await article.save();
  await notificationService.notify({ workspace: workspaceId(req), sender: req.user?._id, recipients: reviewers, type: 'wiki_review_requested', title: `Wiki Review Required: ${article.title}`, message: `${req.user?.name || 'A user'} submitted a wiki article for review.`, refModel: 'WikiArticle', refId: article._id, actionUrl: `/wiki/articles/${article._id}`, channels: { inApp: true, email: true } });
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'submitted_for_review', message: 'Article submitted for review', performedBy: req.user?._id });
  res.json({ success: true, message: 'Article submitted for review', data: article, article });
});

const approve = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  if (!wikiService.canApprove(article, req)) return res.status(403).json({ success: false, message: 'You are not a reviewer for this article' });
  const userId = req.user?._id?.toString();
  const approver = article.approval.approvers.find((item) => item.user?.toString() === userId);
  if (approver) {
    approver.status = 'approved';
    approver.comment = req.body.comment;
    approver.respondedAt = new Date();
  }
  const allApproved = !article.approval.approvers.length || article.approval.approvers.every((item) => item.status === 'approved');
  if (allApproved) {
    article.status = 'published';
    article.approval.status = 'approved';
    article.approval.approvedAt = new Date();
    article.approval.approvedBy = req.user?._id;
    article.publishedAt = new Date();
    article.publishedBy = req.user?._id;
    article.lastReviewedAt = new Date();
    article.lastReviewedBy = req.user?._id;
    article.nextReviewDate = new Date(Date.now() + (article.reviewFrequencyDays || 90) * 24 * 60 * 60 * 1000);
    article.isLocked = false;
  }
  await article.save();
  await wikiService.createVersion({ article, user: req.user?._id, changeSummary: 'Published approved version', changeType: 'review_update' });
  await notificationService.notify({ workspace: workspaceId(req), sender: req.user?._id, recipients: [article.createdBy].filter(Boolean), type: 'wiki_article_approved', title: `Wiki Article Approved: ${article.title}`, message: `${article.title} has been approved and published.`, refModel: 'WikiArticle', refId: article._id, actionUrl: `/wiki/articles/${article._id}`, channels: { inApp: true, email: true } });
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'approved', message: 'Wiki article approved', performedBy: req.user?._id });
  res.json({ success: true, message: 'Wiki article approved successfully', data: article, article });
});

const reject = asyncHandler(async (req, res) => {
  const reason = req.body.reason || req.body.rejectionReason;
  if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  if (!wikiService.canApprove(article, req)) return res.status(403).json({ success: false, message: 'You are not a reviewer for this article' });
  article.status = 'rejected';
  article.approval.status = 'rejected';
  article.approval.rejectionReason = reason;
  article.approval.rejectedAt = new Date();
  article.approval.rejectedBy = req.user?._id;
  article.isLocked = false;
  await article.save();
  await notificationService.notify({ workspace: workspaceId(req), sender: req.user?._id, recipients: [article.createdBy].filter(Boolean), type: 'wiki_article_rejected', title: `Wiki Article Rejected: ${article.title}`, message: reason, refModel: 'WikiArticle', refId: article._id, actionUrl: `/wiki/articles/${article._id}`, channels: { inApp: true, email: true } });
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'rejected', message: reason, performedBy: req.user?._id });
  res.json({ success: true, message: 'Wiki article rejected', data: article, article });
});

const patchStatus = (status, action, message) => asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  if (!wikiService.canEdit(article, req)) return res.status(403).json({ success: false, message: 'You do not have edit permission for this article' });
  article.status = status;
  if (status === 'published') {
    article.publishedAt = new Date();
    article.publishedBy = req.user?._id;
    article.isLocked = false;
  }
  await article.save();
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action, message: message || `Article marked ${status}`, performedBy: req.user?._id });
  res.json({ success: true, message: message || 'Article updated', data: article, article });
});

const toggleFlag = (field, value, action) => asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  article[field] = value;
  await article.save();
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'updated', message: `Article ${action}`, performedBy: req.user?._id });
  res.json({ success: true, data: article, article });
});

const versions = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  const items = await WikiVersion.find({ workspace: workspaceId(req), article: article._id }).sort({ versionNumber: -1 });
  res.json({ success: true, data: items, versions: items });
});

const createVersion = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  const version = await wikiService.createVersion({ article, user: req.user?._id, changeSummary: req.body.changeSummary, changeType: req.body.changeType || 'minor_edit' });
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'version_created', message: 'Wiki version created', performedBy: req.user?._id });
  res.status(201).json({ success: true, data: version, version });
});

const restoreVersion = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  const version = await WikiVersion.findOne({ _id: req.params.versionId, workspace: workspaceId(req), article: article._id });
  if (!version) return res.status(404).json({ success: false, message: 'Version not found' });
  await wikiService.createVersion({ article, user: req.user?._id, changeSummary: 'Snapshot before restore', changeType: 'restore' });
  article.title = version.title;
  article.summary = version.summary;
  article.content = version.content;
  article.contentJson = version.contentJson;
  article.plainText = version.plainText;
  article.tags = version.tags;
  article.status = 'pending_review';
  article.isLocked = false;
  await article.save();
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'version_restored', message: `Restored version ${version.versionNumber}`, performedBy: req.user?._id });
  res.json({ success: true, message: 'Wiki version restored', data: article, article });
});

const addAttachment = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  article.attachments.push({ ...req.body, uploadedBy: req.user?._id, uploadedAt: new Date() });
  await article.save();
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'attachment_added', message: 'Attachment added', performedBy: req.user?._id });
  res.status(201).json({ success: true, data: article.attachments[article.attachments.length - 1], article });
});

const removeAttachment = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  article.attachments = article.attachments.filter((item) => item._id.toString() !== req.params.attachmentId);
  await article.save();
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'attachment_removed', message: 'Attachment removed', performedBy: req.user?._id });
  res.json({ success: true, message: 'Attachment removed', article });
});

const addRelated = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  const relatedId = req.body.relatedArticle || req.body.relatedArticleId;
  if (!article.relatedArticles.some((id) => id.toString() === relatedId)) article.relatedArticles.push(relatedId);
  await article.save();
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'related_article_added', message: 'Related article added', performedBy: req.user?._id });
  res.json({ success: true, data: article, article });
});

const removeRelated = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  article.relatedArticles = article.relatedArticles.filter((id) => id.toString() !== req.params.relatedArticleId);
  await article.save();
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'related_article_removed', message: 'Related article removed', performedBy: req.user?._id });
  res.json({ success: true, data: article, article });
});

const comments = asyncHandler(async (req, res) => {
  const items = await WikiComment.find({ workspace: workspaceId(req), article: articleId(req), isDeleted: { $ne: true } }).populate('createdBy mentions', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, data: items, comments: items });
});

const addComment = asyncHandler(async (req, res) => {
  const item = await WikiComment.create({ ...req.body, workspace: workspaceId(req), article: articleId(req), createdBy: req.user?._id });
  await wikiActivityService.log({ workspace: workspaceId(req), article: articleId(req), action: 'comment_added', message: 'Wiki comment added', performedBy: req.user?._id });
  res.status(201).json({ success: true, data: item, comment: item });
});

const updateComment = asyncHandler(async (req, res) => {
  const item = await WikiComment.findOneAndUpdate({ _id: req.params.commentId, workspace: workspaceId(req), article: articleId(req) }, req.body, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Comment not found' });
  res.json({ success: true, data: item, comment: item });
});

const deleteComment = asyncHandler(async (req, res) => {
  const item = await WikiComment.findOneAndUpdate({ _id: req.params.commentId, workspace: workspaceId(req), article: articleId(req) }, { isDeleted: true }, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Comment not found' });
  res.json({ success: true, message: 'Comment deleted' });
});

const resolveComment = asyncHandler(async (req, res) => {
  const item = await WikiComment.findOneAndUpdate({ _id: req.params.commentId, workspace: workspaceId(req), article: articleId(req) }, { resolved: true, resolvedBy: req.user?._id, resolvedAt: new Date() }, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Comment not found' });
  await wikiActivityService.log({ workspace: workspaceId(req), article: articleId(req), action: 'comment_resolved', message: 'Wiki comment resolved', performedBy: req.user?._id });
  res.json({ success: true, data: item, comment: item });
});

const feedback = asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  const item = await WikiFeedback.create({ workspace: workspaceId(req), article: article._id, user: req.user?._id, helpful: req.body.helpful, comment: req.body.comment });
  if (req.body.helpful) article.helpfulCount += 1;
  else article.notHelpfulCount += 1;
  await article.save();
  await wikiActivityService.log({ workspace: article.workspace, article: article._id, action: 'feedback_given', message: 'Wiki feedback submitted', performedBy: req.user?._id });
  res.status(201).json({ success: true, data: item, feedback: item });
});

const activity = asyncHandler(async (req, res) => {
  const items = await WikiActivity.find({ workspace: workspaceId(req), article: articleId(req) }).populate('performedBy', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, data: items, activity: items });
});

const exportArticle = (format) => asyncHandler(async (req, res) => {
  const article = await WikiArticle.findOne({ ...wikiService.articleAccessQuery(req), _id: articleId(req) });
  if (!article) return res.status(404).json({ success: false, message: 'Wiki article not found' });
  if (format === 'html') return res.type('html').send(article.content || '');
  if (format === 'markdown') return res.type('text').send(`# ${article.title}\n\n${article.plainText || ''}`);
  const doc = new PDFDocument({ margin: 42 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${article.articleNumber}.pdf"`);
    res.send(Buffer.concat(chunks));
  });
  doc.fontSize(18).text(article.title);
  doc.fontSize(10).text(article.articleNumber);
  doc.moveDown();
  doc.text(`Type: ${article.articleType || 'general'}`);
  doc.text(`Status: ${article.status}`);
  doc.text(`Version: ${article.version || 1}`);
  if (article.lastReviewedAt) doc.text(`Last reviewed: ${article.lastReviewedAt.toISOString().slice(0, 10)}`);
  doc.moveDown();
  doc.fontSize(12).text(article.plainText || String(article.content || '').replace(/<[^>]+>/g, ' '), { align: 'left' });
  if (article.attachments?.length) {
    doc.moveDown().fontSize(12).text('Attachments');
    article.attachments.forEach((attachment) => doc.fontSize(10).text(`- ${attachment.fileName || attachment.mediaFile}`));
  }
  doc.moveDown().fontSize(8).text('Generated by ONEPWS Wiki / Knowledge Base', { align: 'center' });
  doc.end();
});

const categories = asyncHandler(async (req, res) => {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true } };
  if (req.query.active !== undefined) query.isActive = req.query.active === 'true';
  const items = await WikiCategory.find(query).sort({ order: 1, name: 1 });
  res.json({ success: true, data: items, categories: items });
});

const createCategory = asyncHandler(async (req, res) => {
  const slug = req.body.slug || require('slugify')(req.body.name || 'category', { lower: true, strict: true });
  const item = await WikiCategory.create({ ...req.body, workspace: workspaceId(req), slug, createdBy: req.user?._id });
  await wikiActivityService.log({ workspace: workspaceId(req), action: 'updated', message: `Wiki category ${item.name} created`, performedBy: req.user?._id });
  res.status(201).json({ success: true, data: item, category: item });
});

const getCategory = asyncHandler(async (req, res) => {
  const item = await WikiCategory.findOne({ _id: req.params.categoryId, workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!item) return res.status(404).json({ success: false, message: 'Wiki category not found' });
  res.json({ success: true, data: item, category: item });
});

const updateCategory = asyncHandler(async (req, res) => {
  const item = await WikiCategory.findOneAndUpdate({ _id: req.params.categoryId, workspace: workspaceId(req), isDeleted: { $ne: true } }, { ...req.body, updatedBy: req.user?._id }, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: 'Wiki category not found' });
  await wikiActivityService.log({ workspace: workspaceId(req), action: 'updated', message: `Wiki category ${item.name} updated`, performedBy: req.user?._id });
  res.json({ success: true, data: item, category: item });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const item = await WikiCategory.findOneAndUpdate({ _id: req.params.categoryId, workspace: workspaceId(req) }, { isDeleted: true, isActive: false, updatedBy: req.user?._id }, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Wiki category not found' });
  await wikiActivityService.log({ workspace: workspaceId(req), action: 'updated', message: `Wiki category ${item.name} archived`, performedBy: req.user?._id });
  res.json({ success: true, message: 'Wiki category deleted' });
});

const categoryArticles = asyncHandler(async (req, res) => {
  req.query.category = req.params.categoryId;
  return list(req, res);
});

const templates = asyncHandler(async (req, res) => {
  const items = await WikiTemplate.find({ workspace: workspaceId(req), isActive: { $ne: false } }).sort({ name: 1 });
  res.json({ success: true, data: items, templates: items });
});

const createTemplate = asyncHandler(async (req, res) => {
  const item = await WikiTemplate.create({ ...req.body, workspace: workspaceId(req), createdBy: req.user?._id });
  await wikiActivityService.log({ workspace: workspaceId(req), action: 'updated', message: `Wiki template ${item.name} created`, performedBy: req.user?._id });
  res.status(201).json({ success: true, data: item, template: item });
});

const getTemplate = asyncHandler(async (req, res) => {
  const item = await WikiTemplate.findOne({ _id: req.params.templateId, workspace: workspaceId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Wiki template not found' });
  res.json({ success: true, data: item, template: item });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const item = await WikiTemplate.findOneAndUpdate({ _id: req.params.templateId, workspace: workspaceId(req) }, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: 'Wiki template not found' });
  res.json({ success: true, data: item, template: item });
});

const setDefaultTemplate = asyncHandler(async (req, res) => {
  const item = await WikiTemplate.findOne({ _id: req.params.templateId, workspace: workspaceId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Wiki template not found' });
  await WikiTemplate.updateMany({ workspace: workspaceId(req), articleType: item.articleType }, { isDefault: false });
  item.isDefault = true;
  await item.save();
  res.json({ success: true, data: item, template: item });
});

const cloneTemplate = asyncHandler(async (req, res) => {
  const item = await WikiTemplate.findOne({ _id: req.params.templateId, workspace: workspaceId(req) }).lean();
  if (!item) return res.status(404).json({ success: false, message: 'Wiki template not found' });
  delete item._id;
  const clone = await WikiTemplate.create({
    ...item,
    name: req.body.name || `${item.name} Copy`,
    isDefault: false,
    createdBy: req.user?._id,
  });
  res.status(201).json({ success: true, data: clone, template: clone });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const item = await WikiTemplate.findOneAndUpdate({ _id: req.params.templateId, workspace: workspaceId(req) }, { isActive: false }, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Wiki template not found' });
  res.json({ success: true, message: 'Wiki template deleted' });
});

const home = asyncHandler(async (req, res) => {
  const workspace = workspaceId(req);
  const [featured, pinned, recent, popular, categoriesList, myDrafts, pendingReviews, needsUpdate] = await Promise.all([
    WikiArticle.find({ workspace, status: 'published', isFeatured: true, isDeleted: { $ne: true } }).limit(6),
    WikiArticle.find({ workspace, status: 'published', isPinned: true, isDeleted: { $ne: true } }).limit(6),
    WikiArticle.find({ workspace, status: 'published', isDeleted: { $ne: true } }).sort({ updatedAt: -1 }).limit(8),
    WikiArticle.find({ workspace, status: 'published', isDeleted: { $ne: true } }).sort({ readCount: -1 }).limit(8),
    WikiCategory.find({ workspace, isDeleted: { $ne: true }, isActive: { $ne: false } }).sort({ order: 1 }).limit(20),
    WikiArticle.find({ workspace, createdBy: req.user?._id, status: 'draft', isDeleted: { $ne: true } }).limit(8),
    WikiArticle.find({ workspace, reviewers: req.user?._id, status: 'pending_review', isDeleted: { $ne: true } }).limit(8),
    WikiArticle.find({ workspace, status: 'needs_update', isDeleted: { $ne: true } }).limit(8),
  ]);
  res.json({ success: true, data: { featured, pinned, recent, popular, categories: categoriesList, myDrafts, pendingReviews, needsUpdate } });
});

const reports = asyncHandler(async (req, res) => {
  const workspace = workspaceId(req);
  const [total, published, drafts, pending, needsUpdate, archived] = await Promise.all([
    WikiArticle.countDocuments({ workspace, isDeleted: { $ne: true } }),
    WikiArticle.countDocuments({ workspace, status: 'published', isDeleted: { $ne: true } }),
    WikiArticle.countDocuments({ workspace, status: 'draft', isDeleted: { $ne: true } }),
    WikiArticle.countDocuments({ workspace, status: 'pending_review', isDeleted: { $ne: true } }),
    WikiArticle.countDocuments({ workspace, status: 'needs_update', isDeleted: { $ne: true } }),
    WikiArticle.countDocuments({ workspace, status: 'archived', isDeleted: { $ne: true } }),
  ]);
  res.json({ success: true, data: { total, published, drafts, pending, needsUpdate, archived } });
});

const exportReports = asyncHandler(async (req, res) => {
  const report = await wikiReportService.buildWikiReport(workspaceId(req));
  if (req.path.includes('/excel')) {
    const rows = report.articles.map((article) => ({
      articleNumber: article.articleNumber,
      title: article.title,
      articleType: article.articleType,
      status: article.status,
      version: article.version,
      readCount: article.readCount,
      helpfulCount: article.helpfulCount,
      notHelpfulCount: article.notHelpfulCount,
      updatedAt: article.updatedAt,
    }));
    return res.json({ success: true, message: 'Wiki Excel export data generated', data: rows });
  }
  const doc = new PDFDocument({ margin: 40 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="wiki-report.pdf"');
    res.send(Buffer.concat(chunks));
  });
  doc.fontSize(18).text('Wiki Knowledge Base Report');
  doc.moveDown();
  Object.entries(report.metrics).forEach(([status, count]) => doc.fontSize(11).text(`${status}: ${count}`));
  doc.moveDown();
  report.articles.slice(0, 100).forEach((article) => {
    doc.fontSize(10).text(`${article.articleNumber} - ${article.title} (${article.status})`);
  });
  doc.end();
});

const bulkExport = asyncHandler(async (req, res) => {
  const report = await wikiReportService.buildWikiReport(workspaceId(req));
  res.json({ success: true, message: 'Bulk wiki export data generated', data: report.articles });
});

module.exports = {
  getAll: list,
  list,
  search: list,
  create,
  getById,
  getOne: getById,
  update,
  remove,
  delete: remove,
  submitReview,
  approve,
  reject,
  publish: patchStatus('published', 'published', 'Wiki article published'),
  needsUpdate: patchStatus('needs_update', 'marked_needs_update', 'Wiki article marked needs update'),
  archive: patchStatus('archived', 'archived', 'Wiki article archived'),
  deprecate: patchStatus('deprecated', 'deprecated', 'Wiki article deprecated'),
  restore: patchStatus('draft', 'restored', 'Wiki article restored'),
  pin: toggleFlag('isPinned', true, 'pinned'),
  unpin: toggleFlag('isPinned', false, 'unpinned'),
  feature: toggleFlag('isFeatured', true, 'featured'),
  unfeature: toggleFlag('isFeatured', false, 'unfeatured'),
  versions,
  createVersion,
  restoreVersion,
  addAttachment,
  removeAttachment,
  addRelated,
  removeRelated,
  comments,
  addComment,
  updateComment,
  deleteComment,
  resolveComment,
  feedback,
  activity,
  exportPdf: exportArticle('pdf'),
  exportHtml: exportArticle('html'),
  exportMarkdown: exportArticle('markdown'),
  categories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  categoryArticles,
  templates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  cloneTemplate,
  home,
  reports,
  exportReports,
  bulkExport,
};
