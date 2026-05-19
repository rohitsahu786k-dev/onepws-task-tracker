import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import campaignApi from '../../api/campaign.api';
import CampaignStatusBadge from '../../components/campaigns/CampaignStatusBadge';
import CampaignPerformancePanel from '../../components/campaigns/CampaignPerformancePanel';
import ContentItemTable from '../../components/content/ContentItemTable';

const CampaignDetail = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    campaignApi.get(id).then((res) => setCampaign(res.data || res.campaign)).catch(() => setCampaign(null));
  }, [id]);

  if (!campaign) return <main className="p-6 text-sm text-slate-500">Loading campaign...</main>;

  return (
    <main className="space-y-5 p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{campaign.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{campaign.campaignNumber} • {campaign.campaignType?.replaceAll('_', ' ')}</p>
        </div>
        <CampaignStatusBadge status={campaign.status} />
      </header>
      <section className="rounded-md border bg-white p-4"><p className="text-sm text-slate-700">{campaign.objective || campaign.description || 'No objective added.'}</p></section>
      <CampaignPerformancePanel performance={campaign.performance} />
      <ContentItemTable items={campaign.contentItems || []} />
    </main>
  );
};

export default CampaignDetail;
