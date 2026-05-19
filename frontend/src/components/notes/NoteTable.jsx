const NoteTable = ({ notes = [], onOpen }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
        <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Visibility</th><th className="px-4 py-3">Updated</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {notes.map((note) => (
          <tr key={note._id} onClick={() => onOpen?.(note)} className="cursor-pointer hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{note.title}</td>
            <td className="px-4 py-3">{note.noteType}</td>
            <td className="px-4 py-3">{note.visibility}</td>
            <td className="px-4 py-3">{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default NoteTable;
