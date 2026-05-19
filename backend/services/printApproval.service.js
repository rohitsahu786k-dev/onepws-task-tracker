function canSendToVendor(printJob) {
  return Boolean(
    printJob?.artwork?.finalPrintFile?.mediaFile &&
    printJob?.vendor &&
    printJob?.quotation?.selectedQuotation &&
    ['approved', 'not_required'].includes(printJob?.approval?.status)
  );
}

module.exports = { canSendToVendor };
