function allApproversApproved(approval) {
  return (approval?.approvers || []).length > 0 && approval.approvers.every((approver) => approver.status === 'approved');
}

module.exports = { allApproversApproved };
