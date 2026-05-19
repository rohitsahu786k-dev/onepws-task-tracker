const NoteActivityTimeline = ({ items = [] }) => (
  <ol className="space-y-2">
    {items.map((item) => <li key={item._id} className="rounded border border-slate-200 px-3 py-2 text-sm">{item.message || item.action}</li>)}
  </ol>
);

export default NoteActivityTimeline;
