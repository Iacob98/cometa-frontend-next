import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  authApi,
  setAuthTokenForAllClients,
  clearAuthTokenForAllClients,
  type LoginRequest,
  type TokenResponse,
  type AuthUser,
} from "@/lib/api-client";

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  token: () => [...authKeys.all, "token"] as const,
};

// Storage utilities
const TOKEN_STORAGE_KEY = "cometa_auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "cometa_refresh_token";
const USER_STORAGE_KEY = "cometa_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeAuthData(tokenResponse: TokenResponse) {
  localStorage.setItem(TOKEN_STORAGE_KEY, tokenResponse.access_token);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokenResponse.refresh_token);
  localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify({
      ...tokenResponse.user,
      permissions: tokenResponse.permissions,
    })
  );

  // Set cookie for middleware
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + (tokenResponse.expires_in * 1000));

  // Only use secure flag in production
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; secure' : '';

  document.cookie = `cometa_auth_token=${tokenResponse.access_token}; expires=${expiryDate.toUTCString()}; path=/; samesite=strict${secureFlag}`;

  // Set token for API clients
  setAuthTokenForAllClients(tokenResponse.access_token);
}

function clearAuthData() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);

  // Clear cookie
  document.cookie = "cometa_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Clear tokens from API clients
  clearAuthTokenForAllClients();
}

// Initialize auth state on app start
export function initializeAuth() {
  const token = getStoredToken();
  if (token) {
    setAuthTokenForAllClients(token);
  }
}

// Hooks
export function useAuth() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      return user;
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (tokenResponse) => {
      // Store auth data
      storeAuthData(tokenResponse);

      // Update auth query cache
      const authUser: AuthUser = {
        ...tokenResponse.user,
        permissions: tokenResponse.permissions,
      };

      queryClient.setQueryData(authKeys.user(), authUser);

      toast.success(`Welcome back, ${tokenResponse.user.first_name}!`);

      // Redirect to dashboard after successful login
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    },
    onError: (error) => {
      toast.error(`Login failed: ${error.message}`);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear auth data
      clearAuthData();

      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authKeys.all });

      // Clear all cached data to prevent data leaks
      queryClient.clear();

      toast.success("Logged out successfully");
    },
    onError: (_error) => {
      // Even if logout fails on server, clear local data
      clearAuthData();
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.clear();

      toast.error("Logout failed");
    },
    onSettled: () => {
      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
  });
}

export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) throw new Error("No refresh token available");
      return authApi.refreshToken(refreshToken);
    },
    onSuccess: (tokenResponse) => {
      storeAuthData(tokenResponse);

      const authUser: AuthUser = {
        ...tokenResponse.user,
        permissions: tokenResponse.permissions,
      };

      queryClient.setQueryData(authKeys.user(), authUser);
    },
    onError: (error) => {
      // If refresh fails, logout user
      clearAuthData();
      queryClient.removeQueries({ queryKey: authKeys.all });

      toast.error("Session expired. Please login again.");

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
  });
}

// Utility hook for checking permissions
export function usePermissions() {
  const { data: user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return user?.role ? roles.includes(user.role) : false;
  };

  return {
    user,
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin: hasRole("admin"),
    isProjectManager: hasRole("pm"),
    isForeman: hasRole("foreman"),
    isWorker: hasAnyRole(["crew", "worker"]),
    isViewer: hasRole("viewer"),
    canManageTeams: hasAnyRole(["admin", "pm", "foreman"]),
    canApproveWork: hasAnyRole(["admin", "pm", "foreman"]),
    canManageWork: hasAnyRole(["admin", "pm", "foreman", "crew", "worker"]),
    canViewFinances: hasAnyRole(["admin", "pm", "foreman"]),
    canManageFinances: hasAnyRole(["admin", "pm"]),
    canManageInventory: hasAnyRole(["admin", "pm", "foreman"]),
  };
}

// Hook for protecting routes
export function useRequireAuth() {
  const { data: user, isLoading, error } = useAuth();

  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}