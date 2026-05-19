import React from 'react';

export default function EmployeeDocumentList({ documents = [] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">Documents</h3>
      <div className="mt-3 space-y-2">
        {documents.map((doc) => <div key={doc._id} className="rounded-md border border-slate-100 p-3 text-sm">{doc.title}<span className="ml-2 text-xs text-slate-500">{doc.documentType}</span></div>)}
        {!documents.length && <p className="text-sm text-slate-500">No documents uploaded.</p>}
      </div>
    </section>
  );
}
