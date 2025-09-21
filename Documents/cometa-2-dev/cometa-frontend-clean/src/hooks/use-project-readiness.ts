import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ProjectReadinessData {
  project_status: string;
  overall_readiness: number;
  total_checks: number;
  completed_checks: number;
  days_to_start?: number;
  critical_issues: number;
  categories: {
    [key: string]: {
      completed: number;
      total: number;
      completed_checks: number[];
    };
  };
  issues?: {
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    action_required?: string;
  }[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  completed: boolean;
  completed_date?: string;
  action_required?: string;
}

export interface ProjectActivationData {
  project_id: string;
  activation_date: string;
  activation_notes?: string;
  responsible_manager: string;
  notify_stakeholders: boolean;
}

export interface StatusUpdateData {
  project_id: string;
  status: string;
}

// Project Readiness Hooks
export function useProjectReadiness(projectId: string) {
  return useQuery({
    queryKey: ['project-readiness', projectId],
    queryFn: async (): Promise<ProjectReadinessData> => {
      const response = await fetch(`/api/project-readiness/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project readiness data');
      }
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProjectChecklist(projectId: string) {
  return useQuery({
    queryKey: ['project-checklist', projectId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      const response = await fetch(`/api/project-readiness/${projectId}/checklist`);
      if (!response.ok) {
        throw new Error('Failed to fetch project checklist');
      }
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StatusUpdateData) => {
      const response = await fetch(`/api/project-readiness/${data.project_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: data.status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update project status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate readiness queries
      queryClient.invalidateQueries({
        queryKey: ['project-readiness', variables.project_id]
      });

      // Update any project queries
      queryClient.invalidateQueries({
        queryKey: ['projects']
      });

      toast.success('Project status updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update project status: ${error.message}`);
    },
  });
}

export function useCreateProjectActivation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectActivationData) => {
      const response = await fetch('/api/project-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project activation');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate readiness and project queries
      queryClient.invalidateQueries({
        queryKey: ['project-readiness', variables.project_id]
      });

      queryClient.invalidateQueries({
        queryKey: ['projects']
      });

      toast.success('Project activation created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create project activation: ${error.message}`);
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, itemId, completed }: { projectId: string; itemId: string; completed: boolean }) => {
      const response = await fetch(`/api/project-readiness/${projectId}/checklist/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update checklist item');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate both checklist and readiness queries
      queryClient.invalidateQueries({
        queryKey: ['project-checklist', variables.projectId]
      });

      queryClient.invalidateQueries({
        queryKey: ['project-readiness', variables.projectId]
      });

      toast.success('Checklist item updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update checklist item: ${error.message}`);
    },
  });
}