export default function WidgetError({ message = 'Could not load this widget.', onRetry }) {
  return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{message}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-2 underline">Retry</button>}</div>;
}
