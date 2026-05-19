import WidgetCard from './WidgetCard';

export default function CalendarWidget({ data }) {
  return <WidgetCard title={data.title}><div className="space-y-2">{data.events?.length ? data.events.map((event) => <a key={event.id} href={event.url} className="block rounded border border-slate-100 p-2 text-sm"><span className="font-medium">{event.title}</span><span className="block text-xs text-slate-500">{event.time} • {event.eventType}</span></a>) : <p className="text-sm text-slate-500">No events today.</p>}</div></WidgetCard>;
}
