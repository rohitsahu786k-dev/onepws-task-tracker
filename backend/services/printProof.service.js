function latestVersion(proofs = []) {
  return proofs.reduce((max, proof) => Math.max(max, Number(proof.version || 0)), 0);
}

module.exports = { latestVersion };
