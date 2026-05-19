function calculateEngagementRate(performance = {}) {
  const totalEngagement = Number(performance.likes || 0) + Number(performance.comments || 0) + Number(performance.shares || 0);
  return performance.reach ? Number(((totalEngagement / Number(performance.reach)) * 100).toFixed(2)) : 0;
}

module.exports = { calculateEngagementRate };
