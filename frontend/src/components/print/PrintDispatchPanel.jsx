export default function PrintDispatchPanel({ dispatches = [] }) {
  return <div className="rounded-md border bg-white p-4"><p className="font-medium">Dispatches</p><div className="mt-3 space-y-2">{dispatches.map((dispatch) => <div key={dispatch._id} className="rounded border p-2 text-sm">{dispatch.dispatchNumber} • {dispatch.status}</div>)}</div></div>;
}
