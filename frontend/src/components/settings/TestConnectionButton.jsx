const TestConnectionButton = ({ onClick, children = 'Test connection' }) => (
  <button type="button" onClick={onClick} className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
    {children}
  </button>
);

export default TestConnectionButton;
