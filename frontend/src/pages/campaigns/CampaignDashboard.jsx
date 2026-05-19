import { useEffect, useState } from 'react';
import campaignApi from '../../api/campaign.api';

export default function CampaignDashboard() {
  const [metrics, setMetrics] = useState({});
  useEffect(() => { campaignApi.dashboard().then((res) => setMetrics(res.data || {})).catch(() => setMetrics({})); }, []);
  return <main className="space-y-4 p-6"><h1 className="text-2xl font-semibold">Campaign Dashboard</h1><div className="grid gap-3 md:grid-cols-4">{Object.entries(metrics).map(([key, value]) => <div key={key} className="rounded-md border bg-white p-4"><p className="text-xs uppercase text-slate-500">{key}</p><p className="text-2xl font-semibold">{value}</p></div>)}</div></main>;
}
