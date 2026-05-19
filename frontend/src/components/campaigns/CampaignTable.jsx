import CampaignStatusBadge from './CampaignStatusBadge';

export default function CampaignTable({ campaigns = [], onOpen }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><th className="px-4 py-3">Campaign</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Status</th></tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign._id} onClick={() => onOpen?.(campaign)} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3"><div className="font-medium text-slate-900">{campaign.name}</div><div className="text-xs text-slate-500">{campaign.campaignNumber}</div></td>
              <td className="px-4 py-3">{campaign.campaignType?.replaceAll('_', ' ')}</td>
              <td className="px-4 py-3">{campaign.startDate?.slice?.(0, 10)} - {campaign.endDate?.slice?.(0, 10)}</td>
              <td className="px-4 py-3"><CampaignStatusBadge status={campaign.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
