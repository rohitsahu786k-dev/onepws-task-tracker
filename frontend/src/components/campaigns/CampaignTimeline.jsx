export default function CampaignTimeline({ campaign }) {
  return <div className="rounded-md border bg-white p-4 text-sm text-slate-600">Timeline: {campaign?.startDate?.slice?.(0, 10)} to {campaign?.endDate?.slice?.(0, 10)}</div>;
}
