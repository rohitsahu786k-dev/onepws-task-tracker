import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as automationApi from '../../api/automation.api';

const AutomationLogs = () => {
  const { workspace } = useAuthStore();
  const workspaceId = workspace?._id;
  const [jobName, setJobName] = useState('meeting_reminder_job');

  const logsQuery = useQuery({
    queryKey: ['automation-logs', workspaceId],
    queryFn: () => automationApi.getAutomationLogs(workspaceId),
    enabled: Boolean(workspaceId)
  });

  const jobsQuery = useQuery({
    queryKey: ['automation-jobs', workspaceId],
    queryFn: () => automationApi.getAutomationJobs(workspaceId),
    enabled: Boolean(workspaceId)
  });

  const runJob = async () => {
    try {
      await automationApi.runAutomationJob(workspaceId, jobName);
      toast.success(`Job ${jobName} executed`);
      logsQuery.refetch();
      jobsQuery.refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to run job');
    }
  };

  const logs = logsQuery.data?.data || [];
  const jobs = jobsQuery.data?.data || [];

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Automation Logs</h1>
        <p className="text-sm text-slate-500">Monitor cron jobs and run supported jobs manually.</p>
      </div>

      <section className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-3 text-sm font-semibold">Manual Run</h2>
        <ManualRunPanel jobName={jobName} setJobName={setJobName} runJob={runJob} />
      </section>

      <section className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-3 text-sm font-semibold">Job Locks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-2">Job</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Last Run</th>
                <th className="px-2 py-2">Last Completed</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.jobName} className="border-t dark:border-slate-800">
                  <td className="px-2 py-2 font-medium">{job.jobName}</td>
                  <td className="px-2 py-2">{job.status}</td>
                  <td className="px-2 py-2">{job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : '-'}</td>
                  <td className="px-2 py-2">{job.lastCompletedAt ? new Date(job.lastCompletedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!jobs.length && <tr><td colSpan={4} className="px-2 py-4 text-slate-500">No job lock records yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-3 text-sm font-semibold">Recent Logs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-2">Job</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Duration</th>
                <th className="px-2 py-2">Processed</th>
                <th className="px-2 py-2">Started</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t dark:border-slate-800">
                  <td className="px-2 py-2 font-medium">{log.jobName}</td>
                  <td className="px-2 py-2">{log.status}</td>
                  <td className="px-2 py-2">{log.durationMs ? `${log.durationMs}ms` : '-'}</td>
                  <td className="px-2 py-2">{log.processedCount ?? 0}</td>
                  <td className="px-2 py-2">{log.startedAt ? new Date(log.startedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!logs.length && <tr><td colSpan={5} className="px-2 py-4 text-slate-500">No cron logs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

function ManualRunPanel({ jobName, setJobName, runJob }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-sm">
        <span className="mb-1 block font-medium">Job name</span>
        <input value={jobName} onChange={(event) => setJobName(event.target.value)} className="rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
      </label>
      <button type="button" onClick={runJob} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white">Run Now</button>
    </div>
  );
}

export default AutomationLogs;
