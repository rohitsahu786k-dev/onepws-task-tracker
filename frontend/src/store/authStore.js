import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/auth.service';
import * as permissionService from '../services/permission.service';

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
      
      setAuth: (user, tokens) => {
        if (tokens) {
          localStorage.setItem('access_token', tokens.accessToken);
          localStorage.setItem('refresh_token', tokens.refreshToken);
        }
        set({ user, isAuthenticated: true, isInitialized: true });
      },
      
      setWorkspace: (workspace) => set({ workspace }),
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
        await authService.logout();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, workspace: null, permissions: [], allowedModules: {}, permissionsLoaded: false, isAuthenticated: false });
      },

      initAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isInitialized: true, isAuthenticated: false });
          return;
        }

        try {
          const res = await authService.getProfile();
          set({ user: res.data, isAuthenticated: true, isInitialized: true });
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
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
