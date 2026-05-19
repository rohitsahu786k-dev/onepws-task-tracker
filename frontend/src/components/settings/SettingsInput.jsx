const SettingsInput = ({ label, ...props }) => (
  <label className="space-y-1 text-sm font-medium">
    {label}
    <input {...props} className="block w-full rounded border border-slate-300 px-3 py-2 text-sm" />
  </label>
);

export default SettingsInput;
