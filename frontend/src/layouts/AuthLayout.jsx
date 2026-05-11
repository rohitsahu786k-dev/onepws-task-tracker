import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <Outlet />
        </div>
      </div>
      <div className="hidden md:flex flex-1 bg-primary text-primary-foreground items-center justify-center p-12">
        <div className="max-w-xl text-center space-y-6">
          <img src="/logo.png" alt="ONEPWS" className="mx-auto h-16 w-auto brightness-0 invert" />
          <h1 className="text-4xl font-bold tracking-tight">ONEPWS Marketing Workflow System</h1>
          <p className="text-lg opacity-90">Centralized workspace for tasks, media, reports, SLAs, and more.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
