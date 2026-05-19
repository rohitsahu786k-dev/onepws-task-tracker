const SettingsSelect = ({ label, options = [], ...props }) => (
  <label className="space-y-1 text-sm font-medium">
    {label}
    <select {...props} className="block w-full rounded border border-slate-300 px-3 py-2 text-sm">
      {options.map((option) => <option key={option.value || option} value={option.value || option}>{option.label || option}</option>)}
    </select>
  </label>
);

export default SettingsSelect;
