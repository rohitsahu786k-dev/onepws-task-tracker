import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import printJobApi from '../../api/printJob.api';
import PrintJobStatusBadge from '../../components/print/PrintJobStatusBadge';
import PrintSpecPanel from '../../components/print/PrintSpecPanel';
import ArtworkFilePanel from '../../components/print/ArtworkFilePanel';
import PrintQuotationTable from '../../components/print/PrintQuotationTable';
import PrintProofPanel from '../../components/print/PrintProofPanel';
import PrintDispatchPanel from '../../components/print/PrintDispatchPanel';
import PrintQualityCheckPanel from '../../components/print/PrintQualityCheckPanel';

export default function PrintJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  useEffect(() => { printJobApi.get(id).then((res) => setJob(res.data || res.printJob)).catch(() => setJob(null)); }, [id]);
  if (!job) return <main className="p-6 text-sm text-slate-500">Loading print job...</main>;
  return <main className="space-y-4 p-6"><header className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">{job.title}</h1><p className="text-sm text-slate-500">{job.printJobNumber} • {job.quantity} units</p></div><PrintJobStatusBadge status={job.status} /></header><PrintSpecPanel specifications={job.specifications} /><ArtworkFilePanel artwork={job.artwork} /><PrintQuotationTable quotations={job.quotations || []} /><PrintProofPanel proofs={job.proofs || []} /><PrintDispatchPanel dispatches={job.dispatches || []} /><PrintQualityCheckPanel checks={job.qualityChecks || []} /></main>;
}
