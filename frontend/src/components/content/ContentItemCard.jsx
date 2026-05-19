import ContentStatusBadge from './ContentStatusBadge';

export default function ContentItemCard({ item, onOpen }) {
  return <button type="button" onClick={() => onOpen?.(item)} className="w-full rounded-md border bg-white p-4 text-left"><div className="flex justify-between gap-3"><p className="font-medium">{item.title}</p><ContentStatusBadge status={item.status} /></div><p className="mt-2 text-sm text-slate-500">{item.platforms?.join(', ') || 'No platform'} • {item.scheduledDate?.slice?.(0, 10)}</p></button>;
}
