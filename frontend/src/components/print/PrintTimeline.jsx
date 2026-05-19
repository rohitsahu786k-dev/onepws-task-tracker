export default function PrintTimeline({ job }) {
  return <div className="rounded-md border bg-white p-4 text-sm text-slate-600">Created to required date: {job?.requiredDate?.slice?.(0, 10)}</div>;
}
