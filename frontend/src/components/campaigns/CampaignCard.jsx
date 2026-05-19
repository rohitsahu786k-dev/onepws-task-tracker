import CampaignStatusBadge from './CampaignStatusBadge';

export default function CampaignCard({ campaign, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen?.(campaign)} className="w-full rounded-md border border-slate-200 bg-white p-4 text-left hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
          <p className="mt-1 text-xs text-slate-500">{campaign.campaignNumber}</p>
        </div>
        <CampaignStatusBadge status={campaign.status} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{campaign.objective || campaign.description || 'No objective added.'}</p>
    </button>
  );
}
