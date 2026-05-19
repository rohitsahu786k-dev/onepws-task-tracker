import React from 'react';

export default function EmployeeActivityTimeline({ activity = [] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">Activity</h3>
      <div className="mt-3 space-y-2">
        {activity.map((item) => <p key={item._id} className="text-sm text-slate-600">{item.message || item.action}</p>)}
        {!activity.length && <p className="text-sm text-slate-500">No activity yet.</p>}
      </div>
    </section>
  );
}
