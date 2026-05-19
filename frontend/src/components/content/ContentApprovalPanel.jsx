export default function ContentApprovalPanel({ item }) {
  return <div className="rounded-md border bg-white p-4"><p className="text-sm font-medium">Approval</p><p className="mt-2 text-sm text-slate-600">{item?.approval?.status || 'not_required'}</p></div>;
}
