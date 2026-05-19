const NoteTagInput = ({ value = [], onChange }) => (
  <input
    value={value.join(', ')}
    onChange={(event) => onChange?.(event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))}
    placeholder="Tags"
    className="rounded border border-slate-300 px-3 py-2 text-sm"
  />
);

export default NoteTagInput;
