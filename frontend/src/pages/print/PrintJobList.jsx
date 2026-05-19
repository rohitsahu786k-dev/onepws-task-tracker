import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import printJobApi from '../../api/printJob.api';
import PrintJobTable from '../../components/print/PrintJobTable';

export default function PrintJobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  useEffect(() => { printJobApi.list().then((res) => setJobs(res.data || res.printJobs || [])).catch(() => setJobs([])); }, []);
  return <main className="space-y-4 p-6"><header className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Print Jobs</h1><p className="text-sm text-slate-500">Track artwork, quotations, proofing, production and delivery.</p></div><button type="button" onClick={() => navigate('/print-jobs/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Create Print Job</button></header><PrintJobTable jobs={jobs} onOpen={(job) => navigate(`/print-jobs/${job._id}`)} /></main>;
}
