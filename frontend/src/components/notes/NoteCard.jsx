const NoteCard = ({ note, onClick }) => (
  <button type="button" onClick={() => onClick?.(note)} className="block w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300">
    <div className="flex items-start justify-between gap-3">
      <h3 className="font-semibold text-slate-900">{note.title}</h3>
      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{note.visibility}</span>
    </div>
    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{note.plainText || note.content?.replace(/<[^>]+>/g, ' ')}</p>
    <div className="mt-3 flex flex-wrap gap-1">
      {(note.tags || []).slice(0, 4).map((tag) => <span key={tag} className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">{tag}</span>)}
    </div>
  </button>
);

export default NoteCard;
