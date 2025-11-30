import { useAuthStore } from "@/store/authStore";

/**
 * Hook to check user role and permissions
 */
export function useRole() {
  const { role, isAdmin, isAuthenticated, user } = useAuthStore();

  const hasRole = (requiredRole: "CUSTOMER" | "ADMIN") => {
    if (!isAuthenticated) return false;
    if (requiredRole === "ADMIN") return isAdmin;
    return role === requiredRole || isAdmin; // Admins can access customer routes
  };

  const isCustomer = role === "CUSTOMER";
  const isAdminUser = isAdmin;

  return {
    role,
    isAdmin: isAdminUser,
    isCustomer,
    isAuthenticated,
    hasRole,
    user,
  };
}

