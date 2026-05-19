export default function CampaignForm({ value = {}, onChange, onSubmit, isSaving }) {
  const set = (key, next) => onChange?.({ ...value, [key]: next });
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }} className="space-y-4">
      <input className="w-full rounded-md border px-3 py-2" placeholder="Campaign name" value={value.name || ''} onChange={(e) => set('name', e.target.value)} required />
      <textarea className="w-full rounded-md border px-3 py-2" placeholder="Objective" value={value.objective || ''} onChange={(e) => set('objective', e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="rounded-md border px-3 py-2" type="date" value={value.startDate || ''} onChange={(e) => set('startDate', e.target.value)} required />
        <input className="rounded-md border px-3 py-2" type="date" value={value.endDate || ''} onChange={(e) => set('endDate', e.target.value)} required />
      </div>
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Campaign'}</button>
    </form>
  );
}
