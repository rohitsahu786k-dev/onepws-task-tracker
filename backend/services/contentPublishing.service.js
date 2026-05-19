function canPublish(contentItem) {
  return ['approved', 'scheduled'].includes(contentItem.status);
}

module.exports = { canPublish };
