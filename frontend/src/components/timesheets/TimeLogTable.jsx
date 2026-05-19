import TimesheetStatusBadge from './TimesheetStatusBadge';

const TimeLogTable = ({ logs = [], onDelete }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
        <tr>
          <th className="px-4 py-3">Date</th>
          <th className="px-4 py-3">Task</th>
          <th className="px-4 py-3">Project</th>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3">Hours</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Description</th>
          <th className="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {logs.map((log) => (
          <tr key={log._id}>
            <td className="px-4 py-3">{new Date(log.logDate).toLocaleDateString()}</td>
            <td className="px-4 py-3">{log.task?.title || log.task?.taskNumber || '-'}</td>
            <td className="px-4 py-3">{log.project?.title || log.project?.projectNumber || '-'}</td>
            <td className="px-4 py-3">{log.workType?.replace(/_/g, ' ')}</td>
            <td className="px-4 py-3 font-medium">{Number(log.durationHours || log.durationMinutes / 60).toFixed(2)}</td>
            <td className="px-4 py-3"><TimesheetStatusBadge status={log.approvalStatus} /></td>
            <td className="px-4 py-3 text-slate-600">{log.description}</td>
            <td className="px-4 py-3 text-right">
              {!log.isLocked && log.approvalStatus !== 'approved' && (
                <button type="button" onClick={() => onDelete?.(log)} className="text-sm font-medium text-rose-600">Delete</button>
              )}
            </td>
          </tr>
        ))}
        {!logs.length && (
          <tr>
            <td className="px-4 py-8 text-center text-slate-500" colSpan="8">No time logs found.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default TimeLogTable;
