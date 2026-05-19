import NoteTagInput from './NoteTagInput';

const NoteEditor = ({ value, onChange }) => {
  const update = (field, nextValue) => onChange?.({ ...value, [field]: nextValue });
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <input value={value.title || ''} onChange={(event) => update('title', event.target.value)} placeholder="Note title" className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-semibold" />
      <div className="grid gap-3 md:grid-cols-3">
        <select value={value.noteType || 'general'} onChange={(event) => update('noteType', event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
          {['general', 'personal', 'task', 'project', 'meeting', 'mom', 'client', 'vendor', 'campaign', 'internal', 'research'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={value.visibility || 'private'} onChange={(event) => update('visibility', event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="private">Private</option>
          <option value="shared">Shared</option>
          <option value="department">Department</option>
          <option value="workspace">Workspace</option>
        </select>
        <NoteTagInput value={value.tags || []} onChange={(tags) => update('tags', tags)} />
      </div>
      <textarea value={value.plainText || ''} onChange={(event) => update('plainText', event.target.value)} rows={14} placeholder="Write note content" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
    </div>
  );
};

export default NoteEditor;
