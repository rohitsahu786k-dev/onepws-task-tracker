const Counter = require('../models/Counter');

async function nextNumber(workspaceId, keyPrefix, prefix) {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace: workspaceId, key: `${keyPrefix}_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

const generatePrintJobNumber = (workspaceId) => nextNumber(workspaceId, 'print_job_number', 'PRN');
const generateQuotationNumber = (workspaceId) => nextNumber(workspaceId, 'print_quotation_number', 'PQUO');
const generateProofNumber = (workspaceId) => nextNumber(workspaceId, 'print_proof_number', 'PPRF');
const generateDispatchNumber = (workspaceId) => nextNumber(workspaceId, 'print_dispatch_number', 'PDSP');

module.exports = { generatePrintJobNumber, generateQuotationNumber, generateProofNumber, generateDispatchNumber };
