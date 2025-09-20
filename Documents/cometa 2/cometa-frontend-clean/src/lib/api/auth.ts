import { apiClient } from "./client";
import { AuthResponse, LoginCredentials, User } from "@/types";

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/api/auth/login", credentials);

    // Store token in client after successful login
    if (response.access_token) {
      apiClient.setAuthToken(response.access_token);
    }

    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      // Clear token regardless of response
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-token");
      }
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/api/auth/me");
  },

  async refreshToken(): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/auth/refresh");
  },

  async generatePinCode(userId: string): Promise<{ pin_code: string }> {
    return apiClient.post<{ pin_code: string }>(`/api/auth/generate-pin/${userId}`);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.put<User>("/api/auth/profile", data);
  },
};