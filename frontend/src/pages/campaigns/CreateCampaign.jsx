import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import campaignApi from '../../api/campaign.api';
import CampaignForm from '../../components/campaigns/CampaignForm';

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [value, setValue] = useState({ campaignType: 'other' });
  const [isSaving, setSaving] = useState(false);
  const save = async () => { setSaving(true); try { const res = await campaignApi.create(value); navigate(`/campaigns/${res.data?._id || res.campaign?._id}`); } finally { setSaving(false); } };
  return <main className="mx-auto max-w-3xl space-y-4 p-6"><h1 className="text-2xl font-semibold">Create Campaign</h1><CampaignForm value={value} onChange={setValue} onSubmit={save} isSaving={isSaving} /></main>;
}
