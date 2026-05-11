const statusClasses = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  rescheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-slate-100 text-slate-700 border-slate-200'
};

const MeetingStatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses[status] || statusClasses.scheduled}`}>
    {String(status || 'scheduled').replace(/_/g, ' ')}
  </span>
);

export default MeetingStatusBadge;
