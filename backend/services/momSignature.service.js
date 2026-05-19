function calculateSignatureSummary(mom) {
  const required = (mom.attendees || []).filter((attendee) => attendee.signatureRequired !== false);
  const signed = required.filter((attendee) => attendee.signed);
  return {
    requiredCount: required.length,
    signedCount: signed.length,
    pendingCount: Math.max(required.length - signed.length, 0),
  };
}

function applySignatureStatus(mom, signedBy) {
  mom.signatureSummary = calculateSignatureSummary(mom);
  if (mom.signatureSummary.pendingCount === 0) {
    mom.status = 'signed';
    mom.isLocked = true;
    mom.lockedAt = new Date();
    mom.lockedBy = signedBy;
  } else if (mom.signatureSummary.signedCount > 0) {
    mom.status = 'partially_signed';
  } else {
    mom.status = 'sent_for_signature';
  }
  return mom;
}

module.exports = { calculateSignatureSummary, applySignatureStatus };
