const cron = require('node-cron');
const WikiArticle = require('../models/WikiArticle');
const notificationService = require('../services/notification.service');
const wikiActivityService = require('../services/wikiActivity.service');
const { runJobWithLog } = require('./cronUtils');

async function checkWikiReviewDue() {
  const articles = await WikiArticle.find({
    status: 'published',
    nextReviewDate: { $lte: new Date() },
    isDeleted: { $ne: true },
  });

  let processedCount = 0;
  for (const article of articles) {
    processedCount += 1;
    article.status = 'needs_update';
    article.isLocked = false;
    await article.save();

    const recipients = [article.owner, ...(article.reviewers || [])].filter(Boolean);
    if (recipients.length) {
      await notificationService.notify({
        workspace: article.workspace,
        recipients,
        type: 'wiki_review_due',
        title: `Wiki Review Due: ${article.title}`,
        message: `${article.title} is due for review.`,
        refModel: 'WikiArticle',
        refId: article._id,
        actionUrl: `/wiki/articles/${article._id}`,
        channels: { inApp: true, email: true },
      });
    }

    await wikiActivityService.log({
      workspace: article.workspace,
      article: article._id,
      action: 'marked_needs_update',
      message: 'Article marked needs update by review reminder',
      performedBy: article.owner || article.createdBy,
    });
  }

  return { processedCount, successCount: processedCount, failedCount: 0 };
}

module.exports = function wikiReviewDueJob() {
  cron.schedule('0 9 * * *', () => runJobWithLog('wiki_review_due_job', checkWikiReviewDue));
};

module.exports.checkWikiReviewDue = checkWikiReviewDue;
