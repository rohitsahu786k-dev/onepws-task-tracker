import { useEffect, useState } from 'react';
import { Play, Square } from 'lucide-react';
import timesheetApi from '../../api/timesheet.api';

const TaskTimer = ({ workspaceId, taskId }) => {
  const [timer, setTimer] = useState(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (workspaceId) timesheetApi.activeTimer(workspaceId).then((res) => setTimer(res.timer || res.data)).catch(() => {});
  }, [workspaceId]);

  const start = async () => {
    const res = await timesheetApi.startTimer(workspaceId, taskId);
    setTimer(res.timer || res.data);
  };

  const stop = async () => {
    if (!timer?.task?._id && !taskId) return;
    await timesheetApi.stopTimer(workspaceId, timer?.task?._id || taskId, { description });
    setTimer(null);
    setDescription('');
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{timer ? `Timer running: ${timer.task?.title || timer.task}` : 'No active timer'}</p>
      </div>
      {timer ? (
        <>
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Stop note" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" onClick={stop} className="inline-flex items-center gap-2 rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white"><Square size={16} /> Stop</button>
        </>
      ) : (
        <button type="button" disabled={!taskId} onClick={start} className="inline-flex items-center gap-2 rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Play size={16} /> Start</button>
      )}
    </div>
  );
};

export default TaskTimer;
