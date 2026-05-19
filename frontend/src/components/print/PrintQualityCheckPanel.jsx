export default function PrintQualityCheckPanel({ checks = [] }) {
  return <div className="rounded-md border bg-white p-4"><p className="font-medium">Quality Checks</p><div className="mt-3 space-y-2">{checks.map((check) => <div key={check._id} className="rounded border p-2 text-sm">{check.finalStatus} • accepted {check.quantityAccepted || 0}</div>)}</div></div>;
}
