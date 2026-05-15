import React from 'react';

const TaskChecklist = ({ title, children, className = '', ...props }) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`} {...props}>
    {title ? <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3> : null}
    {children || <span className="text-sm text-slate-500">TaskChecklist</span>}
  </div>
);

export { TaskChecklist };
export default TaskChecklist;
