import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Menu, X } from 'lucide-react'; // Assuming lucide-react is installed
import NotificationBell from '../components/layout/NotificationBell';
import { usePermission } from '../hooks/usePermission';

const DashboardLayout = () => {
  const { user, workspace, logout, fetchPermissions } = useAuthStore();
  const { can, isModuleEnabled, permissionsLoaded } = usePermission();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const workspaceId = workspace?._id || user?.defaultWorkspace;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', module: 'dashboard', permission: 'dashboard:view' },
    { path: '/tracker', label: 'Daily Tracker', module: 'tracker', permission: 'tracker:view' },
    { path: '/settings/field-builder', label: 'Field Builder', module: 'tracker', permission: 'tracker:configure_fields' },
    { path: '/tasks/board', label: 'Task Board', module: 'tasks', permission: 'tasks:view' },
    { path: '/calendar', label: 'Calendar', module: 'calendar', permission: 'calendar:view' },
    { path: '/meetings', label: 'Meetings', module: 'meetings', permission: 'meetings:view' },
    { path: '/media', label: 'Media Library', module: 'media', permission: 'media:view' },
    { path: '/reports', label: 'Reports & Analytics', module: 'reports', permission: 'reports:view' },
    { path: '/notifications', label: 'Notifications', module: 'notifications', permission: 'notifications:view' },
    { path: '/settings/notifications', label: 'Notification Settings', module: 'settings', permission: 'settings:view' },
    { path: '/settings/modules', label: 'Workspace Modules', module: 'settings', permission: 'settings:update_roles' },
    { path: '/settings/roles', label: 'Roles & Permissions', module: 'settings', permission: 'settings:update_roles' },
    { path: '/settings/email-templates', label: 'Email Templates', module: 'email_templates', permission: 'email_templates:view' },
    { path: '/settings/notification-templates', label: 'Notification Templates', module: 'notifications', permission: 'notifications:manage' },
    { path: '/settings/slack', label: 'Slack Settings', module: 'settings', permission: 'settings:update_integrations' },
    { path: '/settings/telegram', label: 'Telegram Settings', module: 'settings', permission: 'settings:update_integrations' },
    { path: '/settings/zoom', label: 'Zoom Settings', module: 'settings', permission: 'settings:update_integrations' },
    { path: '/settings/google-meet', label: 'Google Meet Settings', module: 'settings', permission: 'settings:update_integrations' }
  ];

  useEffect(() => {
    if (workspaceId) fetchPermissions(workspaceId).catch(() => {});
  }, [workspaceId, fetchPermissions]);

  const visibleLinks = permissionsLoaded
    ? navLinks.filter((link) => isModuleEnabled(link.module) && can(link.permission))
    : navLinks.filter((link) => link.path === '/dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-950 border-r dark:border-slate-800 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setIsSidebarOpen(false)}>
            <img src="/icon.png" alt="" className="h-9 w-9 object-contain" />
            <img src="/logo.png" alt="ONEPWS" className="h-7 w-auto object-contain" />
          </Link>
          <button className="md:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-3 py-2 rounded-md font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                    : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">
              Welcome, {user?.name || 'User'}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationBell />
            <div className="text-xs md:text-sm text-slate-500 hidden sm:block">{user?.email}</div>
            <button 
              onClick={logout}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
