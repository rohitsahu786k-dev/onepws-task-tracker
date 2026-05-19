import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import campaignApi from '../../api/campaign.api';
import CampaignTable from '../../components/campaigns/CampaignTable';

const CampaignList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    campaignApi.list().then((res) => setCampaigns(res.data || res.campaigns || [])).catch(() => setCampaigns([]));
  }, []);

  return (
    <main className="space-y-4 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-600">Plan campaigns, content schedules, approvals and performance.</p>
        </div>
        <button type="button" onClick={() => navigate('/campaigns/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Create Campaign</button>
      </header>
      <CampaignTable campaigns={campaigns} onOpen={(campaign) => navigate(`/campaigns/${campaign._id}`)} />
    </main>
  );
};

export default CampaignList;
