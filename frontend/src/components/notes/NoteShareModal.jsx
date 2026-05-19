const NoteShareModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
        <h2 className="text-lg font-semibold">Share Note</h2>
        <p className="mt-2 text-sm text-slate-500">Share controls are connected to the note share API.</p>
        <button type="button" onClick={onClose} className="mt-4 rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Close</button>
      </div>
    </div>
  );
};

export default NoteShareModal;
