import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import printJobApi from '../../api/printJob.api';
import PrintJobForm from '../../components/print/PrintJobForm';

export default function CreatePrintJob() {
  const navigate = useNavigate();
  const [value, setValue] = useState({ printJobType: 'other' });
  const [isSaving, setSaving] = useState(false);
  const save = async () => { setSaving(true); try { const res = await printJobApi.create(value); navigate(`/print-jobs/${res.data?._id || res.printJob?._id}`); } finally { setSaving(false); } };
  return <main className="mx-auto max-w-3xl space-y-4 p-6"><h1 className="text-2xl font-semibold">Create Print Job</h1><PrintJobForm value={value} onChange={setValue} onSubmit={save} isSaving={isSaving} /></main>;
}
