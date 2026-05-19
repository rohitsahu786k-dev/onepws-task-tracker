import PrintJobStatusBadge from './PrintJobStatusBadge';

export default function PrintJobCard({ job, onOpen }) {
  return <button type="button" onClick={() => onOpen?.(job)} className="w-full rounded-md border bg-white p-4 text-left"><div className="flex justify-between gap-3"><div><p className="font-medium">{job.title}</p><p className="text-xs text-slate-500">{job.printJobNumber}</p></div><PrintJobStatusBadge status={job.status} /></div><p className="mt-2 text-sm text-slate-600">{job.quantity} units • due {job.requiredDate?.slice?.(0, 10)}</p></button>;
}
