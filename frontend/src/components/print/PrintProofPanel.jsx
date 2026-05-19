export default function PrintProofPanel({ proofs = [] }) {
  return <div className="rounded-md border bg-white p-4"><p className="font-medium">Proofs</p><div className="mt-3 space-y-2">{proofs.map((proof) => <div key={proof._id} className="rounded border p-2 text-sm">{proof.proofNumber} • {proof.reviewStatus}</div>)}</div></div>;
}
