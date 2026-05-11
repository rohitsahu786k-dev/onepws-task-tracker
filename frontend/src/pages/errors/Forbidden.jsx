import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">403</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          You do not have permission to access this area.
        </p>
        <Link to="/dashboard" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
