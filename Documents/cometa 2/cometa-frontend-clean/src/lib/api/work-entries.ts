import { apiClient } from "./client";
import {
  WorkEntry,
  WorkEntryFormData,
  WorkEntriesQueryParams,
  PaginatedResponse,
} from "@/types";

export const workEntriesApi = {
  async getAll(params?: WorkEntriesQueryParams): Promise<PaginatedResponse<WorkEntry>> {
    return apiClient.get("/api/work-entries", { params });
  },

  async getById(id: string): Promise<WorkEntry> {
    return apiClient.get(`/api/work-entries/${id}`);
  },

  async create(data: WorkEntryFormData): Promise<WorkEntry> {
    return apiClient.post("/api/work-entries", data);
  },

  async update(id: string, data: Partial<WorkEntryFormData>): Promise<WorkEntry> {
    return apiClient.put(`/api/work-entries/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/work-entries/${id}`);
  },

  async approve(id: string): Promise<WorkEntry> {
    return apiClient.patch(`/api/work-entries/${id}/approve`);
  },

  async reject(id: string, reason?: string): Promise<WorkEntry> {
    return apiClient.patch(`/api/work-entries/${id}/reject`, { reason });
  },

  async uploadPhotos(workEntryId: string, files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`photos`, file);
    });

    return apiClient.post(`/api/work-entries/${workEntryId}/photos`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async getPhotoUploadUrl(workEntryId: string, filename: string): Promise<{
    upload_url: string;
    photo_id: string;
  }> {
    return apiClient.post(`/api/work-entries/${workEntryId}/photos/upload-url`, {
      filename,
    });
  },

  async getByProject(projectId: string, params?: Omit<WorkEntriesQueryParams, "project_id">): Promise<PaginatedResponse<WorkEntry>> {
    return apiClient.get(`/api/projects/${projectId}/work-entries`, { params });
  },

  async getByUser(userId: string, params?: Omit<WorkEntriesQueryParams, "user_id">): Promise<PaginatedResponse<WorkEntry>> {
    return apiClient.get(`/api/users/${userId}/work-entries`, { params });
  },
};