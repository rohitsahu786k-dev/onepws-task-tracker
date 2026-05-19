function calculatePrintQuotationTotal(data = {}) {
  const subtotal =
    Number(data.setupCost || 0) +
    Number(data.designCost || 0) +
    Number(data.printingCost || 0) +
    Number(data.finishingCost || 0) +
    Number(data.packagingCost || 0) +
    Number(data.deliveryCost || 0);
  const taxAmount = subtotal * (Number(data.taxPercent || 0) / 100);
  const totalAmount = subtotal + taxAmount - Number(data.discountAmount || 0);
  return { subtotal, taxAmount, totalAmount };
}

module.exports = { calculatePrintQuotationTotal };
