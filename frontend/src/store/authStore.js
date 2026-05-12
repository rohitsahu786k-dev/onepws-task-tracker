import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/auth.service';
import * as permissionService from '../services/permission.service';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const getDefaultWorkspace = (user) => {
  if (user?.workspaces?.length > 0) {
    return user.workspaces.find((item) => item.isActive !== false)?.workspace || user.workspaces[0].workspace;
  }
  return user?.defaultWorkspace || null;
};

const clearStoredTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      workspace: null,
      workspaceRole: null,
      workspaceDepartment: null,
      allowedModules: {},
      permissions: [],
      permissionsLoaded: false,
      isAuthenticated: false,
      isInitialized: false,
      
      setAuth: async (user, tokens) => {
        if (tokens) {
          localStorage.setItem('access_token', tokens.accessToken);
          localStorage.setItem('refresh_token', tokens.refreshToken);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }

        const defaultWorkspace = getDefaultWorkspace(user);

        set({
          user,
          workspace: defaultWorkspace,
          isAuthenticated: true,
          isInitialized: true
        });

        // Fetch permissions for the workspace
        const workspaceId = getWorkspaceId(defaultWorkspace);
        if (workspaceId) {
          try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/me/permissions`, {
              headers: {
                'Authorization': `Bearer ${tokens?.accessToken || localStorage.getItem('access_token')}`
              }
            });
            const data = await res.json();
            if (data.success && (data.data || data.permissions)) {
              get().setPermissions(data.data || data);
            }
          } catch (err) {
            console.error('Failed to fetch permissions:', err);
          }
        }
      },
      
      setWorkspace: async (workspace) => {
        set({ workspace, permissionsLoaded: false });
        const workspaceId = getWorkspaceId(workspace);
        if (workspaceId) {
          await get().fetchPermissions(workspaceId).catch((err) => {
            console.error('Failed to fetch permissions:', err);
            set({ permissionsLoaded: true });
          });
        }
      },
      setPermissions: (payload) =>
        set({
          workspaceRole: payload?.role || null,
          workspaceDepartment: payload?.department || null,
          allowedModules: payload?.allowedModules || {},
          permissions: payload?.permissions || [],
          permissionsLoaded: true
        }),

      fetchPermissions: async (workspaceId) => {
        if (!workspaceId) return;
        const res = await permissionService.getMyPermissions(workspaceId);
        get().setPermissions(res.data);
      },
      
      logout: async () => {
        try {
          await authService.logout();
        } finally {
          clearStoredTokens();
          set({ user: null, workspace: null, permissions: [], allowedModules: {}, permissionsLoaded: false, isAuthenticated: false });
        }
      },

      initAuth: async () => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
        if (!token) {
          set({ isInitialized: true, isAuthenticated: false });
          return;
        }

        try {
          const res = await authService.getProfile();
          const user = res.user || res.data;
          const defaultWorkspace = getDefaultWorkspace(user);
          set({
            user,
            workspace: defaultWorkspace,
            isAuthenticated: true,
            isInitialized: true
          });

          // Fetch permissions if we have a workspace
          const workspaceId = getWorkspaceId(defaultWorkspace);
          if (workspaceId) {
            get().fetchPermissions(workspaceId).catch(() => set({ permissionsLoaded: true }));
          }
        } catch {
          clearStoredTokens();
          set({ user: null, permissions: [], allowedModules: {}, permissionsLoaded: false, isAuthenticated: false, isInitialized: true });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ workspace: state.workspace }), // Persist workspace selection
    }
  )
);

export default useAuthStore;
