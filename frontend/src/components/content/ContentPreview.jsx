export default function ContentPreview({ item }) {
  return <div className="rounded-md border bg-white p-4"><p className="font-medium">{item?.title}</p><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item?.caption || item?.brief || 'No preview content.'}</p></div>;
}
