import SettingsToggle from './SettingsToggle';

const ModuleToggleGrid = ({ modules = {}, onChange }) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {Object.entries(modules).map(([key, value]) => <SettingsToggle key={key} label={key} checked={value} onChange={(checked) => onChange?.(key, checked)} />)}
  </div>
);

export default ModuleToggleGrid;
