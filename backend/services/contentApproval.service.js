async function submitContentForApproval(contentItem, approvalRequest) {
  contentItem.status = 'review';
  contentItem.approval = { request: approvalRequest?._id, status: 'pending' };
  await contentItem.save();
  return contentItem;
}

module.exports = { submitContentForApproval };
