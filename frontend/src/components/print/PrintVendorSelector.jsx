export default function PrintVendorSelector({ value, onChange }) {
  return <input className="w-full rounded-md border px-3 py-2" placeholder="Vendor ID" value={value || ''} onChange={(e) => onChange?.(e.target.value)} />;
}
