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
import ProjectList from './pages/projects/ProjectList';
import CreateProject from './pages/projects/CreateProject';
import ProjectDetail from './pages/projects/ProjectDetail';
import ProjectArchive from './pages/projects/ProjectArchive';
import SLADashboard from './pages/sla/SLADashboard';
import SLAConfig from './pages/sla/SLAConfig';
import SLAPageReport from './pages/sla/SLAReport';
import MOMList from './pages/mom/MOMList';
import CreateMOM from './pages/mom/CreateMOM';
import MOMDetail from './pages/mom/MOMDetail';
import BudgetList from './pages/budget/BudgetList';
import CreateBudget from './pages/budget/CreateBudget';
import BudgetDetail from './pages/budget/BudgetDetail';
import BudgetDashboard from './pages/budget/BudgetDashboard';
import ExpenseList from './pages/budget/ExpenseList';
import MyTimesheet from './pages/timesheets/MyTimesheet';
import AllTimesheets from './pages/timesheets/AllTimesheets';
import TimesheetApproval from './pages/timesheets/TimesheetApproval';
import PendingApprovals from './pages/approvals/PendingApprovals';
import ApprovalChainConfig from './pages/approvals/ApprovalChainConfig';
import NoteList from './pages/notes/NoteList';
import NoteEditor from './pages/notes/NoteEditor';
import WikiHome from './pages/wiki/WikiHome';
import WikiPage from './pages/wiki/WikiPage';
import WikiEditor from './pages/wiki/WikiEditor';
import EmployeeDirectory from './pages/directory/EmployeeDirectory';
import DepartmentList from './pages/departments/DepartmentList';
import DepartmentDetail from './pages/departments/DepartmentDetail';
import WorkspaceList from './pages/workspaces/WorkspaceList';
import CreateWorkspace from './pages/workspaces/CreateWorkspace';
import WorkspaceMembers from './pages/workspaces/WorkspaceMembers';
import WorkspaceSettings from './pages/workspaces/WorkspaceSettings';
import Settings from './pages/settings/Settings';
import BrandSettings from './pages/settings/BrandSettings';
import SystemSettings from './pages/settings/SystemSettings';
import EmailSettings from './pages/settings/EmailSettings';
import StorageSettings from './pages/settings/StorageSettings';
import BackupSettings from './pages/settings/BackupSettings';
import ApiKeySettings from './pages/settings/ApiKeySettings';
import HelpCenter from './pages/help/HelpCenter';
import HelpArticle from './pages/help/HelpArticle';
import IntakeFormList from './pages/intake/IntakeFormList';
import IntakeFormSelect from './pages/intake/IntakeFormSelect';
import IntakeFormFill from './pages/intake/IntakeFormFill';
import IntakeFormReview from './pages/intake/IntakeFormReview';
import EmailNotifSettings from './pages/settings/EmailNotifSettings';
import SlackSettings from './pages/settings/SlackSettings';
import TelegramSettings from './pages/settings/TelegramSettings';
import ZoomSettings from './pages/settings/ZoomSettings';
import GoogleMeetSettings from './pages/settings/GoogleMeetSettings';
import AutomationLogs from './pages/settings/AutomationLogs';
import MeetingCalendar from './pages/meetings/MeetingCalendar';
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
          <Route path="/meetings/calendar" element={<ProtectedRoute permission="meetings:view"><MeetingCalendar /></ProtectedRoute>} />
          <Route path="/meetings/new" element={<ProtectedRoute permission="meetings:create"><CreateMeeting /></ProtectedRoute>} />
          <Route path="/meetings/:id" element={<ProtectedRoute permission="meetings:view"><MeetingDetail /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute permission="reports:view"><ReportsDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute permission="notifications:view"><Notifications /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute permission="projects:view"><ProjectList /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute permission="projects:create"><CreateProject /></ProtectedRoute>} />
          <Route path="/projects/archive" element={<ProtectedRoute permission="projects:view"><ProjectArchive /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute permission="projects:view"><ProjectDetail /></ProtectedRoute>} />
          <Route path="/sla" element={<SLADashboard />} />
          <Route path="/sla/config" element={<ProtectedRoute permission="sla:configure"><SLAConfig /></ProtectedRoute>} />
          <Route path="/sla/report" element={<SLAPageReport />} />
          <Route path="/mom" element={<ProtectedRoute permission="mom:view"><MOMList /></ProtectedRoute>} />
          <Route path="/mom/new" element={<ProtectedRoute permission="mom:create"><CreateMOM /></ProtectedRoute>} />
          <Route path="/mom/:id" element={<ProtectedRoute permission="mom:view"><MOMDetail /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute permission="budget:view"><BudgetList /></ProtectedRoute>} />
          <Route path="/budgets/dashboard" element={<ProtectedRoute permission="budget:view"><BudgetDashboard /></ProtectedRoute>} />
          <Route path="/budgets/new" element={<ProtectedRoute permission="budget:create"><CreateBudget /></ProtectedRoute>} />
          <Route path="/budgets/:id" element={<ProtectedRoute permission="budget:view"><BudgetDetail /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute permission="expenses:view"><ExpenseList /></ProtectedRoute>} />
          <Route path="/timesheets/my" element={<MyTimesheet />} />
          <Route path="/timesheets/all" element={<AllTimesheets />} />
          <Route path="/timesheets/approvals" element={<TimesheetApproval />} />
          <Route path="/approvals" element={<PendingApprovals />} />
          <Route path="/approvals/chains" element={<ApprovalChainConfig />} />
          <Route path="/notes" element={<NoteList />} />
          <Route path="/notes/new" element={<NoteEditor />} />
          <Route path="/notes/:id" element={<NoteEditor />} />
          <Route path="/wiki" element={<WikiHome />} />
          <Route path="/wiki/new" element={<WikiEditor />} />
          <Route path="/wiki/:id" element={<WikiPage />} />
          <Route path="/wiki/:id/edit" element={<WikiEditor />} />
          <Route path="/directory" element={<EmployeeDirectory />} />
          <Route path="/departments" element={<DepartmentList />} />
          <Route path="/departments/:id" element={<DepartmentDetail />} />
          <Route path="/workspaces" element={<WorkspaceList />} />
          <Route path="/workspaces/new" element={<CreateWorkspace />} />
          <Route path="/workspaces/:id/members" element={<WorkspaceMembers />} />
          <Route path="/workspaces/:id/settings" element={<WorkspaceSettings />} />
          <Route path="/settings" element={<ProtectedRoute permission="settings:view"><Settings /></ProtectedRoute>} />
          <Route path="/settings/brand" element={<ProtectedRoute permission="settings:update"><BrandSettings /></ProtectedRoute>} />
          <Route path="/settings/system" element={<ProtectedRoute permission="settings:update"><SystemSettings /></ProtectedRoute>} />
          <Route path="/settings/email" element={<ProtectedRoute permission="settings:update_email"><EmailSettings /></ProtectedRoute>} />
          <Route path="/settings/storage" element={<ProtectedRoute permission="settings:update"><StorageSettings /></ProtectedRoute>} />
          <Route path="/settings/backups" element={<BackupSettings />} />
          <Route path="/settings/api-keys" element={<ApiKeySettings />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/help/:id" element={<HelpArticle />} />
          <Route path="/intake" element={<IntakeFormList />} />
          <Route path="/intake/new" element={<IntakeFormSelect />} />
          <Route path="/intake/:id" element={<IntakeFormFill />} />
          <Route path="/intake/:id/review" element={<IntakeFormReview />} />
          <Route path="/settings/notifications" element={<ProtectedRoute permission="settings:view"><EmailNotifSettings /></ProtectedRoute>} />
          <Route path="/settings/slack" element={<ProtectedRoute permission="settings:update_integrations"><SlackSettings /></ProtectedRoute>} />
          <Route path="/settings/telegram" element={<ProtectedRoute permission="settings:update_integrations"><TelegramSettings /></ProtectedRoute>} />
          <Route path="/settings/zoom" element={<ProtectedRoute permission="settings:update_integrations"><ZoomSettings /></ProtectedRoute>} />
          <Route path="/settings/google-meet" element={<ProtectedRoute permission="settings:update_integrations"><GoogleMeetSettings /></ProtectedRoute>} />
          <Route path="/settings/automation" element={<ProtectedRoute permission="settings:view"><AutomationLogs /></ProtectedRoute>} />
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
