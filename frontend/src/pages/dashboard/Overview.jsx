import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FolderKanban,
  Gauge,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import useAuthStore from '../../store/authStore';
import * as taskService from '../../services/task.service';
import * as trackerService from '../../services/tracker.service';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;
const COLORS = ['#e92f2e', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed'];

const normalizeArray = (payload, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const Overview = () => {
  const { user, workspace } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace) || getWorkspaceId(user?.defaultWorkspace);

  const tasksQuery = useQuery({
    queryKey: ['dashboard-tasks', workspaceId],
    queryFn: () => taskService.getTasks(workspaceId, { limit: 200 }),
    enabled: Boolean(workspaceId),
  });

  const trackerQuery = useQuery({
    queryKey: ['dashboard-tracker', workspaceId],
    queryFn: () => trackerService.getTrackerRows(workspaceId, { limit: 200 }),
    enabled: Boolean(workspaceId),
  });

  const tasks = useMemo(() => normalizeArray(tasksQuery.data, ['tasks', 'items']), [tasksQuery.data]);
  const trackerRows = useMemo(() => normalizeArray(trackerQuery.data, ['rows', 'items']), [trackerQuery.data]);

  const dashboard = useMemo(() => {
    const openTasks = tasks.filter((task) => !['done', 'closed', 'completed', 'cancelled'].includes(String(task.status || task.stage || '').toLowerCase()));
    const overdueTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date() && !['done', 'closed', 'completed'].includes(String(task.status || '').toLowerCase());
    });
    const delayedTrackerRows = trackerRows.filter((row) => {
      const value = row.calculatedData?.delay_in_time || row.calculatedData?.delayInTime || row.rowData?.delay_in_time;
      return String(value || '').toLowerCase().includes('delayed');
    });

    const stageMap = new Map();
    tasks.forEach((task) => {
      const label = task.stage?.name || task.stageName || task.status || 'Open';
      stageMap.set(label, (stageMap.get(label) || 0) + 1);
    });

    const typeMap = new Map();
    trackerRows.forEach((row) => {
      const label = row.rowData?.type_of_task || row.rowData?.typeOfTask || 'Unassigned';
      typeMap.set(label, (typeMap.get(label) || 0) + 1);
    });

    const completedTasks = tasks.filter((task) => ['done', 'closed', 'completed'].includes(String(task.status || task.stage || '').toLowerCase())).length;
    const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const onTimeTracker = trackerRows.length ? Math.max(0, trackerRows.length - delayedTrackerRows.length) : 0;
    const onTimeRate = trackerRows.length ? Math.round((onTimeTracker / trackerRows.length) * 100) : 0;

    return {
      activeTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      trackerRows: trackerRows.length,
      delayedTrackerRows: delayedTrackerRows.length,
      completionRate,
      onTimeRate,
      stageData: [...stageMap.entries()].map(([name, value]) => ({ name, value })).slice(0, 6),
      typeData: [...typeMap.entries()].map(([name, value]) => ({ name, value })).slice(0, 6),
      recentTasks: [...tasks]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        .slice(0, 5),
      upcomingTasks: [...tasks]
        .filter((task) => task.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5),
    };
  }, [tasks, trackerRows]);

  const isLoading = tasksQuery.isLoading || trackerQuery.isLoading;
  const hasWorkspace = Boolean(workspaceId);
  const liveDataWarning = tasksQuery.isError || trackerQuery.isError;

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-0 lg:grid-cols-[1fr_22rem]">
          <div className="p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles size={14} /> ONEPWS Marketing Command Center
              </span>
              {liveDataWarning && (
                <span className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertTriangle size={14} /> Live API data unavailable
                </span>
              )}
            </div>
            <div className="mt-4 max-w-3xl">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-3xl">
                {hasWorkspace ? `${workspace?.name || 'Workspace'} operational dashboard` : 'Create a workspace to start operations'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Track marketing requests, task movement, SLA health, team workload, media, reports, and admin controls from one professional workspace view.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <PrimaryAction to="/tasks/board" icon={Plus} label="New task" />
              <SecondaryAction to="/tracker" icon={FileSpreadsheet} label="Open tracker" />
              <SecondaryAction to="/reports" icon={BarChart3} label="Reports" />
              <SecondaryAction to="/settings" icon={ShieldCheck} label="Admin settings" />
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today Focus</p>
            <div className="mt-4 space-y-3">
              <FocusItem icon={Clock3} title="Overdue tasks" value={dashboard.overdueTasks} tone="red" />
              <FocusItem icon={Gauge} title="Tracker on-time rate" value={`${dashboard.onTimeRate}%`} tone="green" />
              <FocusItem icon={Users} title="Active workload" value={dashboard.activeTasks} tone="blue" />
            </div>
          </div>
        </div>
      </section>

      {!hasWorkspace ? (
        <section className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">No workspace selected</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Create or join a workspace to unlock departments, tracker rows, tasks, reports, and permissions.</p>
          <Link to="/workspaces/new" className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
            <Plus size={16} /> Create workspace
          </Link>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Active Tasks" value={dashboard.activeTasks} icon={FolderKanban} helper={`${dashboard.completionRate}% completion`} />
            <MetricCard title="Tracker Rows" value={dashboard.trackerRows} icon={FileSpreadsheet} helper={`${dashboard.delayedTrackerRows} delayed`} tone="blue" />
            <MetricCard title="SLA Health" value={`${dashboard.onTimeRate}%`} icon={Gauge} helper="On-time tracker performance" tone="green" />
            <MetricCard title="Overdue" value={dashboard.overdueTasks} icon={AlertTriangle} helper="Needs admin attention" tone="red" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
            <ChartPanel title="Task Flow By Stage" action="/tasks/board">
              {isLoading ? <PanelSkeleton /> : dashboard.stageData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dashboard.stageData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#e92f2e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyPanel title="No tasks yet" action="/tasks/board" actionLabel="Create tasks" />}
            </ChartPanel>

            <ChartPanel title="Tracker Mix" action="/tracker">
              {isLoading ? <PanelSkeleton /> : dashboard.typeData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={dashboard.typeData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={95} paddingAngle={3}>
                      {dashboard.typeData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyPanel title="No tracker rows yet" action="/tracker" actionLabel="Open tracker" />}
            </ChartPanel>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <WorkQueue tasks={dashboard.upcomingTasks} />
            <AdminPanel />
            <ActivityList tasks={dashboard.recentTasks} />
          </section>
        </>
      )}
    </main>
  );
};

const PrimaryAction = ({ to, icon: Icon, label }) => (
  <Link to={to} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
    <Icon size={16} /> {label}
  </Link>
);

const SecondaryAction = ({ to, icon: Icon, label }) => (
  <Link to={to} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
    <Icon size={16} /> {label}
  </Link>
);

const FocusItem = ({ icon: Icon, title, value, tone }) => {
  const tones = {
    red: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  };
  return (
    <div className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <span className={`inline-flex size-9 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon size={17} />
        </span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</span>
      </div>
      <span className="text-lg font-semibold text-slate-950 dark:text-white">{value}</span>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, helper, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  };
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
        </div>
        <span className={`inline-flex size-10 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </article>
  );
};

const ChartPanel = ({ title, action, children }) => (
  <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
      <Link to={action} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
        Open <ArrowUpRight size={13} />
      </Link>
    </div>
    {children}
  </section>
);

const EmptyPanel = ({ title, action, actionLabel }) => (
  <div className="flex h-[280px] flex-col items-center justify-center rounded-md border border-dashed border-slate-200 text-center dark:border-slate-800">
    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
    <Link to={action} className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">
      <Plus size={14} /> {actionLabel}
    </Link>
  </div>
);

const PanelSkeleton = () => <div className="h-[280px] animate-pulse rounded-md bg-slate-100 dark:bg-slate-900" />;

const WorkQueue = ({ tasks }) => (
  <section className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
    <PanelHeader icon={CalendarDays} title="Upcoming Deadlines" to="/calendar" />
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {tasks.map((task) => <TaskRow key={task._id || task.id || task.title} task={task} />)}
      {!tasks.length && <EmptyList text="No upcoming dated tasks." />}
    </div>
  </section>
);

const ActivityList = ({ tasks }) => (
  <section className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
    <PanelHeader icon={MessageSquareText} title="Recent Activity" to="/notifications" />
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {tasks.map((task) => <TaskRow key={task._id || task.id || task.title} task={task} compact />)}
      {!tasks.length && <EmptyList text="No recent activity yet." />}
    </div>
  </section>
);

const AdminPanel = () => {
  const actions = [
    { title: 'Configure tracker fields', to: '/settings/field-builder', icon: FileSpreadsheet },
    { title: 'Manage roles and access', to: '/settings/roles', icon: ShieldCheck },
    { title: 'Review SLA configuration', to: '/sla/config', icon: Gauge },
    { title: 'Publish reports', to: '/reports', icon: BarChart3 },
  ];
  return (
    <section className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <PanelHeader icon={ShieldCheck} title="Admin Control" to="/settings" />
      <div className="p-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.to} to={action.to} className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900">
              <span className="flex items-center gap-3"><Icon size={16} className="text-primary" /> {action.title}</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </Link>
          );
        })}
      </div>
    </section>
  );
};

const PanelHeader = ({ icon: Icon, title, to }) => (
  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
    <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
      <Icon size={16} className="text-primary" /> {title}
    </h2>
    <Link to={to} className="text-xs font-semibold text-primary hover:underline">View all</Link>
  </div>
);

const TaskRow = ({ task, compact = false }) => (
  <Link to="/tasks/board" className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{task.title || task.taskTitle || 'Untitled task'}</p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {task.taskNumber || task.status || 'Marketing task'}{task.dueDate && !compact ? ` - Due ${new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : ''}
        </p>
      </div>
      {task.status && (
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {String(task.status).replace(/_/g, ' ')}
        </span>
      )}
    </div>
  </Link>
);

const EmptyList = ({ text }) => (
  <div className="flex items-center gap-2 px-4 py-8 text-sm text-slate-500">
    <CheckCircle2 size={16} className="text-green-600" /> {text}
  </div>
);

export default Overview;
