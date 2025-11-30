import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, getCurrentUser, login as loginUser, logout as logoutUser, register as registerUser } from "@/lib/auth";

interface AuthState {
  user: User | null;
  role: "CUSTOMER" | "ADMIN" | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      loading: true,
      isAuthenticated: false,
      isAdmin: false,

      setUser: (user: User | null) => {
        set({
          user,
          role: user?.role || null,
          isAuthenticated: !!user,
          isAdmin: user?.role === "ADMIN",
          loading: false,
        });
      },

      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const user = await loginUser({ email, password });
          // Set user directly from login response
          set({
            user,
            role: user.role,
            isAuthenticated: true,
            isAdmin: user.role === "ADMIN",
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      register: async (firstName: string, lastName: string, email: string, password: string) => {
        set({ loading: true });
        try {
          const newUser = await registerUser({ firstName, lastName, email, password });
          // After registration, verify session to ensure cookie is set
          // If register doesn't auto-login, we'll get user from the response
          const sessionUser = await getCurrentUser();
          const user = sessionUser || newUser; // Use session user if available, otherwise use register response
          set({
            user,
            role: user.role,
            isAuthenticated: true,
            isAdmin: user.role === "ADMIN",
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await logoutUser();
          set({
            user: null,
            role: null,
            isAuthenticated: false,
            isAdmin: false,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      refreshUser: async () => {
        set({ loading: true });
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            // User is authenticated, update state
            set({
              user: currentUser,
              role: currentUser.role,
              isAuthenticated: true,
              isAdmin: currentUser.role === "ADMIN",
              loading: false,
            });
          } else {
            // No valid session, clear user state
            set({
              user: null,
              role: null,
              isAuthenticated: false,
              isAdmin: false,
              loading: false,
            });
          }
        } catch (error) {
          // On error, clear user state (session might be invalid)
          set({
            user: null,
            role: null,
            isAuthenticated: false,
            isAdmin: false,
            loading: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
      // Rehydrate state on mount
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          // Ensure derived state is set correctly
          state.isAuthenticated = !!state.user;
          state.isAdmin = state.user.role === "ADMIN";
        }
      },
    }
  )
);

