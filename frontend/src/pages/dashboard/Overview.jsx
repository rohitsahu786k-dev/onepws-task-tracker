const Overview = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">124</p>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Tasks</h3>
          <p className="text-3xl font-bold text-amber-500 mt-2">42</p>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">SLA Breaches</h3>
          <p className="text-3xl font-bold text-red-500 mt-2">3</p>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending MOM Signatures</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">5</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border dark:border-slate-800 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-slate-500">Recent Tasks Activity Feed</p>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border dark:border-slate-800 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-slate-500">Upcoming Meetings</p>
        </div>
      </div>
    </div>
  );
};

export default Overview;
