function hasSpecifications(printJob) {
  return Boolean(printJob?.specifications && Object.keys(printJob.specifications.toObject?.() || printJob.specifications).length);
}

module.exports = { hasSpecifications };
