"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

/**
 * AuthProvider component that initializes auth state on mount
 * Checks session via /api/auth/session endpoint to verify HTTP-only cookie
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshUser } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check session on mount to verify if user is logged in via HTTP-only cookie
    const checkSession = async () => {
      await refreshUser();
      setInitialized(true);
    };
    
    checkSession();
  }, [refreshUser]);

  // Show loading state while checking session
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook for authentication with navigation helpers
 * Uses Zustand store under the hood
 */
export function useAuth() {
  const router = useRouter();
  const {
    user,
    role,
    loading,
    isAuthenticated,
    isAdmin,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    refreshUser,
  } = useAuthStore();

  const login = async (email: string, password: string) => {
    await storeLogin(email, password);
    router.push("/");
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    await storeRegister(firstName, lastName, email, password);
    router.push("/");
  };

  const logout = async () => {
    await storeLogout();
    router.push("/");
  };

  return {
    user,
    role,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    refreshUser,
  };
}

