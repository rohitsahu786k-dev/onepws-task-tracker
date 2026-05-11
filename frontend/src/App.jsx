import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { Toaster } from 'react-hot-toast';
import { useSocket } from './hooks/useSocket';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import Overview from './pages/dashboard/Overview';
import DailyTracker from './pages/tracker/DailyTracker';
import FieldBuilder from './pages/tracker/FieldBuilder';
import TaskBoard from './pages/tasks/TaskBoard';
import MediaLibrary from './pages/media/MediaLibrary';
import CalendarView from './pages/calendar/Calendar';
import MeetingList from './pages/meetings/MeetingList';
import CreateMeeting from './pages/meetings/CreateMeeting';
import MeetingDetail from './pages/meetings/MeetingDetail';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import Notifications from './pages/notifications/Notifications';
import EmailNotifSettings from './pages/settings/EmailNotifSettings';
import SlackSettings from './pages/settings/SlackSettings';
import TelegramSettings from './pages/settings/TelegramSettings';
import ZoomSettings from './pages/settings/ZoomSettings';
import GoogleMeetSettings from './pages/settings/GoogleMeetSettings';
import EmailTemplates from './pages/settings/EmailTemplates';
import NotificationTemplates from './pages/settings/NotificationTemplates';
import RolePermissions from './pages/settings/RolePermissions';
import ModuleSettings from './pages/settings/ModuleSettings';
import Forbidden from './pages/errors/Forbidden';
import { usePermission } from './hooks/usePermission';

const ProtectedRoute = ({ children, permission }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { can, permissionsLoaded } = usePermission();
  const location = useLocation();

  if (!isInitialized) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !permissionsLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading permissions...</div>;
  }

  if (permission && !can(permission)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { initAuth } = useAuthStore();
  useSocket();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth Routes */}
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Dashboard Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/tracker" element={<ProtectedRoute permission="tracker:view"><DailyTracker /></ProtectedRoute>} />
          <Route path="/settings/field-builder" element={<ProtectedRoute permission="tracker:configure_fields"><FieldBuilder /></ProtectedRoute>} />
          <Route path="/tasks/board" element={<ProtectedRoute permission="tasks:view"><TaskBoard /></ProtectedRoute>} />
          <Route path="/media" element={<ProtectedRoute permission="media:view"><MediaLibrary /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute permission="calendar:view"><CalendarView /></ProtectedRoute>} />
          <Route path="/meetings" element={<ProtectedRoute permission="meetings:view"><MeetingList /></ProtectedRoute>} />
          <Route path="/meetings/new" element={<ProtectedRoute permission="meetings:create"><CreateMeeting /></ProtectedRoute>} />
          <Route path="/meetings/:id" element={<ProtectedRoute permission="meetings:view"><MeetingDetail /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute permission="reports:view"><ReportsDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute permission="notifications:view"><Notifications /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute permission="settings:view"><EmailNotifSettings /></ProtectedRoute>} />
          <Route path="/settings/slack" element={<ProtectedRoute permission="settings:update_integrations"><SlackSettings /></ProtectedRoute>} />
          <Route path="/settings/telegram" element={<ProtectedRoute permission="settings:update_integrations"><TelegramSettings /></ProtectedRoute>} />
          <Route path="/settings/zoom" element={<ProtectedRoute permission="settings:update_integrations"><ZoomSettings /></ProtectedRoute>} />
          <Route path="/settings/google-meet" element={<ProtectedRoute permission="settings:update_integrations"><GoogleMeetSettings /></ProtectedRoute>} />
          <Route path="/settings/email-templates" element={<ProtectedRoute permission="email_templates:view"><EmailTemplates /></ProtectedRoute>} />
          <Route path="/settings/notification-templates" element={<ProtectedRoute permission="notifications:manage"><NotificationTemplates /></ProtectedRoute>} />
          <Route path="/settings/roles" element={<ProtectedRoute permission="settings:update_roles"><RolePermissions /></ProtectedRoute>} />
          <Route path="/settings/modules" element={<ProtectedRoute permission="settings:update_roles"><ModuleSettings /></ProtectedRoute>} />
          <Route path="/403" element={<Forbidden />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
