const SettingsToggle = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 text-sm font-medium">
    {label}
    <input type="checkbox" checked={checked} onChange={(event) => onChange?.(event.target.checked)} />
  </label>
);

export default SettingsToggle;
