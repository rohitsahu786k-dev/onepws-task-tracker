import React from 'react';

export default function WikiAttachmentList({ attachments = [] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Attachments</h3>
      <div className="mt-3 space-y-2">
        {attachments.map((attachment) => <div key={attachment._id || attachment.fileName} className="rounded-md border border-slate-100 px-3 py-2 text-sm">{attachment.fileName || attachment.mediaFile}</div>)}
        {!attachments.length && <p className="text-sm text-slate-500">No attachments linked.</p>}
      </div>
    </section>
  );
}
