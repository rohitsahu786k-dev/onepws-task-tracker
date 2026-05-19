import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import * as taskService from '../../services/task.service';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'open', title: 'Open', color: '#e2e8f0', accent: '#64748b', dot: '#94a3b8' },
  { id: 'in_progress', title: 'In Progress', color: '#dbeafe', accent: '#2563eb', dot: '#3b82f6' },
  { id: 'waiting_for_feedback', title: 'Waiting Feedback', color: '#fef3c7', accent: '#d97706', dot: '#f59e0b' },
  { id: 'closed', title: 'Closed', color: '#dcfce7', accent: '#16a34a', dot: '#22c55e' },
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#f59e0b', high: '#ef4444', urgent: '#7c3aed' };

// ─── Create Task Modal ────────────────────────────────────────────────────────
function CreateTaskModal({ workspaceId, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    status: 'open', dueDate: '', estimatedHours: '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Task title is required');
    setLoading(true);
    try {
      await taskService.createTask(workspaceId, {
        ...form,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        dueDate: form.dueDate || undefined,
      });
      toast.success('Task created!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Create New Task</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Title *</label>
            <input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Design brochure for expo" required autoFocus />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add task details..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Status</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_for_feedback">Waiting Feedback</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Priority</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Due Date</label>
              <input type="date" style={{ ...inp, colorScheme: 'light' }} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Est. Hours</label>
              <input type="number" min="0" style={inp} value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating...' : '+ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onStatusChange }) {
  const [changing, setChanging] = useState(false);

  const moveToNext = async () => {
    const cols = COLUMNS.map(c => c.id);
    const idx = cols.indexOf(task.status);
    if (idx === cols.length - 1) return;
    const nextStatus = cols[idx + 1];
    setChanging(true);
    try {
      await onStatusChange(task._id, nextStatus);
    } finally {
      setChanging(false);
    }
  };

  const priorityColor = PRIORITY_COLORS[task.priority] || '#94a3b8';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'closed';

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s, transform 0.1s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{task.taskNumber}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isOverdue && <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>OVERDUE</span>}
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: priorityColor }} title={task.priority} />
        </div>
      </div>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 8px', lineHeight: 1.4 }}>{task.title}</h4>
      {task.description && <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: -4 }}>
          {(task.assignedTo || []).slice(0, 3).map((user, i) => (
            <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: '#dbeafe', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#2563eb', marginLeft: i > 0 ? -8 : 0 }}>
              {(user.name || user.email || '?').charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {task.dueDate && <span style={{ fontSize: 11, color: isOverdue ? '#dc2626' : '#94a3b8' }}>{new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
          {task.status !== 'closed' && (
            <button onClick={moveToNext} disabled={changing} title="Move to next stage" style={{ fontSize: 11, background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>
              {changing ? '...' : '→'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────
const TaskBoard = () => {
  const { workspace } = useAuthStore();
  const queryClient = useQueryClient();
  const workspaceId = workspace?._id || workspace?.id || workspace;
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', workspaceId],
    queryFn: () => taskService.getTasks(workspaceId),
    enabled: !!workspaceId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => taskService.updateTaskStatus(workspaceId, taskId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] }),
    onError: () => { toast.error('Failed to update task status'); queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] }); },
  });

  const allTasks = useMemo(() => {
    let tasks = data?.data || data?.tasks || [];
    if (search) tasks = tasks.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()) || t.taskNumber?.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority) tasks = tasks.filter(t => t.priority === filterPriority);
    return tasks;
  }, [data, search, filterPriority]);

  const tasksByColumn = useMemo(() => {
    const grouped = { open: [], in_progress: [], waiting_for_feedback: [], closed: [] };
    allTasks.forEach(task => {
      if (grouped[task.status]) grouped[task.status].push(task);
      else grouped.open.push(task);
    });
    return grouped;
  }, [allTasks]);

  const handleStatusChange = (taskId, status) => updateStatusMutation.mutateAsync({ taskId, status });

  if (!workspaceId) {
    return (
      <div style={{ padding: 48, textAlign: 'center', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>Select a workspace to use Task Board</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Kanban stages and tasks are workspace-specific.</p>
        <Link to="/workspaces/new" style={{ display: 'inline-block', marginTop: 16, background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Create workspace</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 20 }}>
        {COLUMNS.map(col => (
          <div key={col.id} style={{ flex: 1, minWidth: 280 }}>
            <div style={{ height: 40, background: '#f1f5f9', borderRadius: 10, marginBottom: 12 }} />
            {[1, 2, 3].map(i => <div key={i} style={{ height: 100, background: '#f8fafc', borderRadius: 12, marginBottom: 10, border: '1px solid #e2e8f0' }} />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showCreate && <CreateTaskModal workspaceId={workspaceId} onClose={() => setShowCreate(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] })} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Task Board</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search tasks..."
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', width: 200 }}
          />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)}
            style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            + Create Task
          </button>
        </div>
      </div>

      {/* Board Columns */}
      <div style={{ display: 'flex', gap: 18, overflowX: 'auto', flex: 1, paddingBottom: 8 }}>
        {COLUMNS.map(col => (
          <div key={col.id} style={{ minWidth: 280, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Column Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.dot, display: 'inline-block' }} />
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>{col.title}</h3>
              </div>
              <span style={{ background: col.color, color: col.accent, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                {tasksByColumn[col.id]?.length || 0}
              </span>
            </div>

            {/* Drop Zone */}
            <div style={{ background: col.color, borderRadius: 14, padding: 10, flex: 1, minHeight: 200, border: `1.5px solid ${col.accent}22` }}>
              {tasksByColumn[col.id]?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 12px', color: '#94a3b8', fontSize: 13 }}>
                  No tasks yet
                </div>
              )}
              {tasksByColumn[col.id]?.map(task => (
                <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;
