import React, { useState } from 'react';

export default function WikiApprovalPanel({ article, onSubmitReview, onApprove, onReject, onPublish }) {
  const [reason, setReason] = useState('');
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Approval</h3>
      <p className="mt-1 text-sm text-slate-600">Current approval status: {article?.approval?.status || 'pending'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {['draft', 'rejected', 'needs_update'].includes(article?.status) && <button onClick={onSubmitReview} className="rounded-md border border-slate-200 px-3 py-2 text-sm">Submit Review</button>}
        {article?.status === 'pending_review' && <button onClick={() => onApprove?.({ comment: 'Approved from article detail.' })} className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white">Approve</button>}
        {article?.status === 'pending_review' && <button onClick={() => onReject?.({ reason: reason || 'Changes requested.' })} className="rounded-md bg-rose-600 px-3 py-2 text-sm text-white">Reject</button>}
        {article?.status !== 'published' && <button onClick={onPublish} className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white">Publish</button>}
      </div>
      {article?.status === 'pending_review' && (
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} placeholder="Rejection reason" className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
      )}
    </section>
  );
}
