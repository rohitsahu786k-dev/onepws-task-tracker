import React, { useState } from 'react';

export default function WikiCommentBox({ comments = [], onAdd }) {
  const [message, setMessage] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    onAdd?.({ message, commentType: 'comment' });
    setMessage('');
  };
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Comments</h3>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input value={message} onChange={(event) => setMessage(event.target.value)} className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm" placeholder="Add a suggestion or correction..." />
        <button className="rounded-md bg-blue-600 px-3 text-sm text-white">Post</button>
      </form>
      <div className="mt-4 space-y-3">
        {comments.map((comment) => (
          <div key={comment._id} className="rounded-md bg-slate-50 p-3">
            <p className="text-sm text-slate-700">{comment.message}</p>
            <p className="mt-1 text-xs text-slate-500">{comment.commentType} {comment.resolved ? '• resolved' : ''}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
