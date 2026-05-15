const calculateDueAt = (startAt = new Date(), hours = 24) => new Date(new Date(startAt).getTime() + Number(hours) * 60 * 60 * 1000);

const getSlaStatus = (dueAt, completedAt) => {
  if (!dueAt) return 'not_configured';
  const end = completedAt ? new Date(completedAt) : new Date();
  return end > new Date(dueAt) ? 'breached' : 'within_sla';
};

module.exports = { calculateDueAt, getSlaStatus };
