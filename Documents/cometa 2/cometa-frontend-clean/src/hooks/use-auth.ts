import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { LoginCredentials, User } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      // Store user data
      queryClient.setQueryData(["current-user"], data.user);

      // Show success message
      toast.success("Successfully logged in");

      // Redirect to dashboard
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();

      // Redirect to login
      router.push("/auth/login");

      toast.success("Successfully logged out");
    },
    onError: () => {
      // Still redirect on error (token might be invalid)
      queryClient.clear();
      router.push("/auth/login");
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if unauthorized
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => authApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update cached user data
      queryClient.setQueryData(["current-user"], updatedUser);
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });
}

export function useGeneratePinCode() {
  return useMutation({
    mutationFn: (userId: string) => authApi.generatePinCode(userId),
    onSuccess: (data) => {
      toast.success(`New PIN code generated: ${data.pin_code}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate PIN code");
    },
  });
}