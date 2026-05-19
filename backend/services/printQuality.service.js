function statusToPrintJobStatus(finalStatus) {
  return finalStatus === 'reprint_required' || finalStatus === 'rejected' ? 'reprint_required' : 'completed';
}

module.exports = { statusToPrintJobStatus };
