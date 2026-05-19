export default function WidgetCustomizeDrawer({ open, onClose }) {
  if (!open) return null;
  return <div className="fixed inset-y-0 right-0 z-50 w-80 border-l bg-white p-4 shadow-xl"><button type="button" onClick={onClose} className="mb-4 rounded border px-3 py-1 text-sm">Close</button><p className="text-sm text-slate-600">Widget customization is ready for layout editing.</p></div>;
}
