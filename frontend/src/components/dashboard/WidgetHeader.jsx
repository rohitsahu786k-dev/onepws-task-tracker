export default function WidgetHeader({ title, children }) {
  return <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{title}</h3>{children}</div>;
}
