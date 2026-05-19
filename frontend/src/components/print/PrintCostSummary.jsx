export default function PrintCostSummary({ quotation = {} }) {
  return <div className="rounded-md border bg-white p-4"><p className="text-sm font-medium">Cost Summary</p><p className="mt-2 text-2xl font-semibold">{quotation.approvedCost || quotation.totalAmount || 0}</p></div>;
}
