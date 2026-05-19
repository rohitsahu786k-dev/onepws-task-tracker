const SettingsCard = ({ title, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    {title && <h2 className="mb-3 text-base font-semibold text-slate-900">{title}</h2>}
    {children}
  </section>
);

export default SettingsCard;
