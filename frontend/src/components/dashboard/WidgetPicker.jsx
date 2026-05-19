export default function WidgetPicker({ widgets = [], onAdd }) {
  return <div className="grid gap-3">{widgets.map((widget) => <button key={widget.widgetKey} type="button" onClick={() => onAdd?.(widget)} className="rounded-md border p-3 text-left"><p className="font-medium">{widget.title}</p><p className="text-xs text-slate-500">{widget.description}</p></button>)}</div>;
}
