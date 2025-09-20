import { apiClient } from "./client";
import {
  Project,
  ProjectFormData,
  ProjectsQueryParams,
  PaginatedResponse,
  DashboardStats,
} from "@/types";

export const projectsApi = {
  async getAll(params?: ProjectsQueryParams): Promise<PaginatedResponse<Project>> {
    return apiClient.get("/api/projects", { params });
  },

  async getById(id: string): Promise<Project> {
    return apiClient.get(`/api/projects/${id}`);
  },

  async create(data: ProjectFormData): Promise<Project> {
    return apiClient.post("/api/projects", data);
  },

  async update(id: string, data: Partial<ProjectFormData>): Promise<Project> {
    return apiClient.put(`/api/projects/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/projects/${id}`);
  },

  async getProgress(id: string): Promise<{
    total_meters: number;
    completed_meters: number;
    progress_percentage: number;
    work_entries_count: number;
  }> {
    return apiClient.get(`/api/projects/${id}/progress`);
  },

  async getDashboardStats(userId?: string): Promise<DashboardStats> {
    const params = userId ? { user_id: userId } : undefined;
    return apiClient.get("/api/dashboard/aggregated", { params });
  },

  async getProjectTeams(id: string): Promise<any[]> {
    return apiClient.get(`/api/projects/${id}/teams`);
  },

  async assignTeam(projectId: string, teamId: string): Promise<void> {
    return apiClient.post(`/api/projects/${projectId}/teams`, { team_id: teamId });
  },

  async removeTeam(projectId: string, teamId: string): Promise<void> {
    return apiClient.delete(`/api/projects/${projectId}/teams/${teamId}`);
  },
};