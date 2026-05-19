const WikiArticle = require('../models/WikiArticle');
const WikiCategory = require('../models/WikiCategory');

async function buildWikiReport(workspace) {
  const statusRows = await WikiArticle.aggregate([
    { $match: { workspace, isDeleted: { $ne: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const categoryRows = await WikiArticle.aggregate([
    { $match: { workspace, isDeleted: { $ne: true } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const categories = await WikiCategory.find({ workspace }).select('name');
  const categoryName = new Map(categories.map((item) => [item._id.toString(), item.name]));
  const articles = await WikiArticle.find({ workspace, isDeleted: { $ne: true } })
    .populate('category', 'name')
    .populate('owner createdBy', 'name email')
    .sort({ updatedAt: -1 });

  return {
    metrics: Object.fromEntries(statusRows.map((row) => [row._id || 'unknown', row.count])),
    byCategory: categoryRows.map((row) => ({
      category: row._id ? categoryName.get(row._id.toString()) || 'Uncategorized' : 'Uncategorized',
      count: row.count,
    })),
    mostViewed: articles.slice().sort((a, b) => (b.readCount || 0) - (a.readCount || 0)).slice(0, 10),
    leastHelpful: articles.slice().sort((a, b) => (b.notHelpfulCount || 0) - (a.notHelpfulCount || 0)).slice(0, 10),
    articles,
  };
}

module.exports = { buildWikiReport };
