import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import timesheetApi from '../../api/timesheet.api';
import TimeLogForm from '../../components/timesheets/TimeLogForm';
import TimeLogTable from '../../components/timesheets/TimeLogTable';
import WeeklyTimesheetGrid from '../../components/timesheets/WeeklyTimesheetGrid';
import TimesheetSummaryCards from '../../components/timesheets/TimesheetSummaryCards';
import TimesheetCalendarView from '../../components/timesheets/TimesheetCalendarView';
import TimesheetStatusBadge from '../../components/timesheets/TimesheetStatusBadge';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const MyTimesheet = () => {
  const { workspace, user } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace) || getWorkspaceId(user?.defaultWorkspace);
  const [loading, setLoading] = useState(true);
  const [timesheet, setTimesheet] = useState(null);
  const [logs, setLogs] = useState([]);

  const load = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await timesheetApi.current(workspaceId);
      setTimesheet(res.timesheet || res.data?.timesheet);
      setLogs(res.logs || res.data?.logs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  const addLog = async (payload) => {
    await timesheetApi.create(workspaceId, payload);
    toast.success('Time log added');
    await load();
  };

  const deleteLog = async (log) => {
    await timesheetApi.removeLog(workspaceId, log._id);
    toast.success('Time log deleted');
    await load();
  };

  const submitTimesheet = async () => {
    if (!timesheet?._id) return;
    await timesheetApi.submit(workspaceId, timesheet._id);
    toast.success('Timesheet submitted');
    await load();
  };

  return (
    <main className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Timesheet</h1>
          <p className="mt-1 text-sm text-slate-600">{timesheet ? `${new Date(timesheet.periodStart).toLocaleDateString()} - ${new Date(timesheet.periodEnd).toLocaleDateString()}` : 'Current period'}</p>
        </div>
        <div className="flex items-center gap-3">
          <TimesheetStatusBadge status={timesheet?.status} />
          <button type="button" disabled={!timesheet?._id || !['draft', 'reopened', 'rejected'].includes(timesheet?.status)} onClick={submitTimesheet} className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Submit
          </button>
        </div>
      </header>

      <TimesheetSummaryCards timesheet={timesheet} />
      <TimeLogForm onSubmit={addLog} disabled={!workspaceId || loading || ['submitted', 'approved', 'locked'].includes(timesheet?.status)} />
      <WeeklyTimesheetGrid logs={logs} timesheet={timesheet} />
      <TimesheetCalendarView dailySummary={timesheet?.dailySummary || []} />
      <TimeLogTable logs={logs} onDelete={deleteLog} />
    </main>
  );
};

export default MyTimesheet;
