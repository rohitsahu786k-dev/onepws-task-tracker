import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock3,
  FolderKanban,
  Gauge,
  HardDrive,
  HelpCircle,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import NotificationBell from '../components/layout/NotificationBell';
import ThemeToggle from '../components/layout/ThemeToggle';
import WorkspaceSwitcher from '../components/layout/WorkspaceSwitcher';
import { usePermission } from '../hooks/usePermission';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const navigationSections = [
  {
    title: 'Command Center',
    links: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard', permission: 'dashboard:view' },
      { path: '/tasks/board', label: 'Task Board', icon: FolderKanban, module: 'tasks', permission: 'tasks:view' },
      { path: '/tracker', label: 'Daily Tracker', icon: ClipboardList, module: 'tracker', permission: 'tracker:view' },
      { path: '/calendar', label: 'Calendar', icon: CalendarDays, module: 'calendar', permission: 'calendar:view' },
      { path: '/reports', label: 'Reports', icon: BarChart3, module: 'reports', permission: 'reports:view' },
    ],
  },
  {
    title: 'Operations',
    links: [
      { path: '/projects', label: 'Projects', icon: BriefcaseBusiness, module: 'projects', permission: 'projects:view' },
      { path: '/sla', label: 'SLA Center', icon: Gauge, module: 'sla' },
      { path: '/mom', label: 'MOM', icon: MessageSquareText, module: 'mom', permission: 'mom:view' },
      { path: '/meetings', label: 'Meetings', icon: Users, module: 'meetings', permission: 'meetings:view' },
      { path: '/timesheets/my', label: 'Timesheets', icon: Clock3, module: 'timesheets' },
      { path: '/approvals', label: 'Approvals', icon: CheckSquare, module: 'tasks', permission: 'tasks:view' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { path: '/media', label: 'Media Library', icon: Library, module: 'media', permission: 'media:view' },
      { path: '/budgets', label: 'Budgets', icon: WalletCards, module: 'budget', permission: 'budget:view' },
      { path: '/notes', label: 'Notes', icon: BookOpen, module: 'notes', permission: 'notes:view' },
      { path: '/wiki', label: 'Knowledge Base', icon: Library, module: 'wiki', permission: 'wiki:view' },
      { path: '/directory', label: 'Directory', icon: Users, module: 'users', permission: 'users:view' },
    ],
  },
  {
    title: 'Admin',
    links: [
      { path: '/workspaces', label: 'Workspaces', icon: HardDrive, module: 'workspace', permission: 'workspace:view' },
      { path: '/departments', label: 'Departments', icon: Users, module: 'departments', permission: 'departments:view' },
      { path: '/settings', label: 'Settings', icon: Settings, module: 'settings', permission: 'settings:view' },
      { path: '/settings/roles', label: 'Roles & Access', icon: ShieldCheck, module: 'settings', permission: 'settings:update_roles' },
      { path: '/help', label: 'Help Center', icon: HelpCircle, module: 'dashboard', permission: 'dashboard:view' },
    ],
  },
];

const searchDestinations = [
  { keywords: ['task', 'kanban', 'board'], path: '/tasks/board' },
  { keywords: ['tracker', 'daily', 'spreadsheet'], path: '/tracker' },
  { keywords: ['calendar', 'deadline'], path: '/calendar' },
  { keywords: ['report', 'analytics'], path: '/reports' },
  { keywords: ['media', 'file', 'asset'], path: '/media' },
  { keywords: ['meeting'], path: '/meetings' },
  { keywords: ['mom'], path: '/mom' },
  { keywords: ['budget', 'expense'], path: '/budgets' },
  { keywords: ['setting', 'smtp', 'slack', 'zoom', 'role'], path: '/settings' },
];

const DashboardLayout = () => {
  const { user, workspace, logout, fetchPermissions } = useAuthStore();
  const { can, isModuleEnabled, permissionsLoaded } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const workspaceId = getWorkspaceId(workspace) || getWorkspaceId(user?.defaultWorkspace);

  useEffect(() => {
    if (workspaceId) fetchPermissions(workspaceId).catch(() => {});
  }, [workspaceId, fetchPermissions]);

  const isSuperAdmin = user?.globalRole === 'super_admin' || user?.role === 'super_admin';
  const visibleSections = useMemo(() => navigationSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => {
        if (isSuperAdmin) return true;
        if (!permissionsLoaded) return link.path === '/dashboard';
        return isModuleEnabled(link.module) && (!link.permission || can(link.permission));
      }),
    }))
    .filter((section) => section.links.length > 0), [can, isModuleEnabled, isSuperAdmin, permissionsLoaded]);

  const breadcrumb = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (!parts.length) return ['Dashboard'];
    return parts.map((part) => part.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()));
  }, [location.pathname]);

  const handleSearch = (event) => {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    if (!normalized) return;
    const match = searchDestinations.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
    navigate(match?.path || `/reports`);
    setQuery('');
  };

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">OP</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight">ONEPWS</span>
              <span className="block truncate text-xs text-slate-500">Marketing System</span>
            </span>
          </Link>
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <WorkspaceSwitcher />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {visibleSections.map((section) => (
            <section key={section.title}>
              <h2 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{section.title}</h2>
              <div className="mt-2 space-y-1">
                {section.links.map((link) => <SidebarLink key={link.path} link={link} onNavigate={() => setIsSidebarOpen(false)} />)}
              </div>
            </section>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Sparkles size={16} className="text-primary" /> AI-ready workflow
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Tasks, tracker, SLA, MOM, reports, and notifications are wired into one workspace shell.</p>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
            <button type="button" className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden" onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation">
              <Menu size={21} />
            </button>

            <div className="hidden min-w-0 flex-1 md:block">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                {breadcrumb.map((item, index) => (
                  <span key={`${item}-${index}`} className="inline-flex items-center gap-1">
                    {index > 0 && <ChevronRight size={13} />}
                    <span className={index === breadcrumb.length - 1 ? 'font-medium text-slate-800 dark:text-slate-200' : ''}>{item}</span>
                  </span>
                ))}
              </div>
              <h1 className="mt-0.5 truncate text-base font-semibold text-slate-950 dark:text-white">
                {breadcrumb[breadcrumb.length - 1] || 'Dashboard'}
              </h1>
            </div>

            <form onSubmit={handleSearch} className="hidden w-full max-w-md items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 xl:flex">
              <Search size={17} className="shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search tasks, reports, media, settings..."
                aria-label="Global search"
              />
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-950">Ctrl K</kbd>
            </form>

            <Link to="/notifications" className="hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900 sm:inline-flex">
              <Bell size={16} /> Activity
            </Link>
            <ThemeToggle />
            <NotificationBell />

            <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-800 sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="max-w-44 truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="max-w-44 truncate text-xs text-slate-500">{isSuperAdmin ? 'Super Admin' : 'Workspace User'}</p>
              </div>
              <button type="button" onClick={logout} className="inline-flex size-9 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950" title="Logout">
                {initials}
              </button>
              <button type="button" onClick={logout} className="hidden items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white md:inline-flex">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4 dark:bg-slate-950 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const SidebarLink = ({ link, onNavigate }) => {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-primary text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
        }`
      }
    >
      <Icon size={18} />
      <span className="truncate">{link.label}</span>
    </NavLink>
  );
};

export default DashboardLayout;
