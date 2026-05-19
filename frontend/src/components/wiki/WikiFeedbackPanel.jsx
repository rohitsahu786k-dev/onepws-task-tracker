import React, { useState } from 'react';

export default function WikiFeedbackPanel({ article, onFeedback }) {
  const [comment, setComment] = useState('');
  const send = (helpful) => onFeedback?.({ helpful, comment });
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Was this article helpful?</h3>
      <div className="mt-3 flex gap-2">
        <button onClick={() => send(true)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">Yes ({article?.helpfulCount || 0})</button>
        <button onClick={() => send(false)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">No ({article?.notHelpfulCount || 0})</button>
      </div>
      <input value={comment} onChange={(event) => setComment(event.target.value)} className="mt-3 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Optional feedback" />
    </section>
  );
}
