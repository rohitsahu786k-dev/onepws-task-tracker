function canApprove(article, req) {
  return require('./wiki.service').canApprove(article, req);
}

function canEdit(article, req) {
  return require('./wiki.service').canEdit(article, req);
}

module.exports = { canApprove, canEdit };
