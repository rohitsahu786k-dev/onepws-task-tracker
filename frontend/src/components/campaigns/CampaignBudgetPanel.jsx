export default function CampaignBudgetPanel({ campaign }) {
  return <div className="rounded-md border bg-white p-4"><p className="text-sm font-medium">Budget</p><p className="mt-2 text-2xl font-semibold">{campaign?.actualSpend || 0} / {campaign?.estimatedBudget || 0}</p></div>;
}
