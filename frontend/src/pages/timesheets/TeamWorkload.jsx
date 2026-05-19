import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import timesheetApi from '../../api/timesheet.api';
import WorkloadBar from '../../components/timesheets/WorkloadBar';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const TeamWorkload = () => {
  const { workspace, user } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace) || getWorkspaceId(user?.defaultWorkspace);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (workspaceId) timesheetApi.workload(workspaceId).then((res) => setRows(res.workload || res.data || [])).catch(() => {});
  }, [workspaceId]);

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Team Workload</h1>
      </header>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Expected</th><th className="px-4 py-3">Logged</th><th className="px-4 py-3">Workload</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.user?._id || row.user}>
                <td className="px-4 py-3 font-medium">{row.user?.name || row.user?.email || 'User'}</td>
                <td className="px-4 py-3">{row.expectedHours}h</td>
                <td className="px-4 py-3">{row.loggedHours}h</td>
                <td className="px-4 py-3"><WorkloadBar value={row.workloadPercent} /></td>
                <td className="px-4 py-3 capitalize">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
};

export default TeamWorkload;
