const NoteSidebar = ({ folders = [], activeFolder, onSelect }) => (
  <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <button type="button" onClick={() => onSelect?.('')} className={`block w-full rounded px-3 py-2 text-left text-sm ${!activeFolder ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>All Notes</button>
    {folders.map((folder) => (
      <button key={folder._id} type="button" onClick={() => onSelect?.(folder._id)} className={`mt-1 block w-full rounded px-3 py-2 text-left text-sm ${activeFolder === folder._id ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
        {folder.name}
      </button>
    ))}
  </aside>
);

export default NoteSidebar;
