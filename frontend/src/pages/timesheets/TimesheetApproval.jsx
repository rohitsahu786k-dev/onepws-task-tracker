import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import timesheetApi from '../../api/timesheet.api';
import TimesheetStatusBadge from '../../components/timesheets/TimesheetStatusBadge';
import TimesheetApprovalPanel from '../../components/timesheets/TimesheetApprovalPanel';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const TimesheetApproval = () => {
  const { workspace, user } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace) || getWorkspaceId(user?.defaultWorkspace);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');

  const load = async () => {
    if (!workspaceId) return;
    const res = await timesheetApi.pendingApprovals(workspaceId);
    setItems(res.timesheets || res.data || []);
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  const approve = async () => {
    await timesheetApi.approve(workspaceId, selected._id, { comment: 'Approved.' });
    toast.success('Timesheet approved');
    setSelected(null);
    await load();
  };

  const reject = async () => {
    if (!reason.trim()) return toast.error('Rejection reason is required');
    await timesheetApi.reject(workspaceId, selected._id, { reason });
    toast.success('Timesheet rejected');
    setSelected(null);
    setReason('');
    await load();
  };

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Timesheet Approvals</h1>
        <p className="mt-1 text-sm text-slate-600">{items.length} pending approvals</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item._id} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{item.user?.name || item.user?.email || 'User'}</td>
                  <td className="px-4 py-3">{new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{Number(item.totalHours || 0).toFixed(2)}h</td>
                  <td className="px-4 py-3"><TimesheetStatusBadge status={item.status} /></td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No pending approvals.</td></tr>}
            </tbody>
          </table>
        </section>

        <aside className="space-y-3">
          {selected ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold">{selected.user?.name || selected.user?.email || 'User'}</p>
                <p className="mt-2 text-2xl font-semibold">{Number(selected.totalHours || 0).toFixed(2)}h</p>
                <p className="text-sm text-slate-500">Overtime {Number((Number(selected.overtimeMinutes || 0) / 60).toFixed(2))}h</p>
              </div>
              <TimesheetApprovalPanel onApprove={approve} onReject={reject} rejectionReason={reason} onReasonChange={setReason} />
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">Select a submitted timesheet.</div>
          )}
        </aside>
      </div>
    </main>
  );
};

export default TimesheetApproval;
