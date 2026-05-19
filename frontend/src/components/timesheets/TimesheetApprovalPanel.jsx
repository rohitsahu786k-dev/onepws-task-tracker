import { Check, X } from 'lucide-react';

const TimesheetApprovalPanel = ({ onApprove, onReject, rejectionReason, onReasonChange, disabled }) => (
  <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
    <input value={rejectionReason} onChange={(event) => onReasonChange?.(event.target.value)} placeholder="Rejection reason" className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm" />
    <button type="button" disabled={disabled} onClick={onApprove} className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
      <Check size={16} /> Approve
    </button>
    <button type="button" disabled={disabled} onClick={onReject} className="inline-flex items-center justify-center gap-2 rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
      <X size={16} /> Reject
    </button>
  </div>
);

export default TimesheetApprovalPanel;
