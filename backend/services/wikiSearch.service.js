const WikiArticle = require('../models/WikiArticle');
const wikiService = require('./wiki.service');

async function searchArticles(req) {
  const query = wikiService.articleAccessQuery(req);
  if (req.query.search || req.query.q) {
    const search = new RegExp(req.query.search || req.query.q, 'i');
    query.$or = [
      { articleNumber: search },
      { title: search },
      { summary: search },
      { plainText: search },
      { tags: search },
    ];
  }
  ['category', 'articleType', 'status', 'owner'].forEach((key) => {
    if (req.query[key]) query[key] = req.query[key];
  });
  return WikiArticle.find(query).sort({ isPinned: -1, updatedAt: -1 });
}

module.exports = { searchArticles };
