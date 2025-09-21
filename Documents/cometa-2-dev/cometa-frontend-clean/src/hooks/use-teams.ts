import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  teamsApi,
  type Crew,
  type PaginatedResponse,
} from "@/lib/api-client";

// Query keys
export const teamKeys = {
  all: ["teams"] as const,
  crews: () => [...teamKeys.all, "crews"] as const,
  crew: (id: string) => [...teamKeys.all, "crew", id] as const,
};

// Hooks
export function useTeams() {
  return useQuery({
    queryKey: teamKeys.crews(),
    queryFn: () => teamsApi.getCrews(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCrew(id: string) {
  return useQuery({
    queryKey: teamKeys.crew(id),
    queryFn: () => teamsApi.getCrew(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Crew>) => teamsApi.createCrew(data),
    onSuccess: (newCrew) => {
      // Invalidate and refetch crews list
      queryClient.invalidateQueries({ queryKey: teamKeys.crews() });

      // Add the new crew to the cache
      queryClient.setQueryData(teamKeys.crew(newCrew.id), newCrew);

      toast.success("Team created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create team: ${error.message}`);
    },
  });
}

export function useUpdateCrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Crew> }) =>
      teamsApi.updateCrew(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: teamKeys.crew(id) });

      // Snapshot the previous value
      const previousCrew = queryClient.getQueryData(teamKeys.crew(id));

      // Optimistically update to the new value
      queryClient.setQueryData(teamKeys.crew(id), (old: Crew | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      // Return a context object with the snapshotted value
      return { previousCrew };
    },
    onError: (error, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCrew) {
        queryClient.setQueryData(teamKeys.crew(id), context.previousCrew);
      }
      toast.error(`Failed to update team: ${error.message}`);
    },
    onSuccess: () => {
      // Invalidate and refetch crews list
      queryClient.invalidateQueries({ queryKey: teamKeys.crews() });
      toast.success("Team updated successfully");
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: teamKeys.crew(id) });
    },
  });
}

export function useDeleteCrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamsApi.deleteCrew(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: teamKeys.crew(deletedId) });

      // Invalidate crews list
      queryClient.invalidateQueries({ queryKey: teamKeys.crews() });

      toast.success("Team deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete team: ${error.message}`);
    },
  });
}

// Additional interfaces for project preparation
export interface ProjectUser {
  id: string;
  name: string;
  email: string;
  role: string;
  assigned_at: string;
  assigned_by: string;
}

export interface GlobalTeam {
  id: string;
  name: string;
  foreman_name?: string;
  is_active: boolean;
  project_count?: number;
  specialization?: string;
}

// Additional hooks for project preparation
export function useGlobalTeams() {
  return useQuery({
    queryKey: ['global-teams'],
    queryFn: async (): Promise<GlobalTeam[]> => {
      const response = await fetch('/api/crews');
      if (!response.ok) {
        throw new Error('Failed to fetch global teams');
      }
      const crews = await response.json();

      // Transform to GlobalTeam format and count projects per team
      const projectCounts: Record<string, number> = {};
      crews.forEach((crew: any) => {
        if (crew.project_id) {
          projectCounts[crew.name] = (projectCounts[crew.name] || 0) + 1;
        }
      });

      return crews.map((crew: any) => ({
        id: crew.id,
        name: crew.name,
        foreman_name: crew.foreman_name,
        is_active: crew.is_active,
        project_count: projectCounts[crew.name] || 0,
        specialization: 'mixed'
      }));
    },
  });
}

export function useProjectUsers(projectId: string) {
  return useQuery({
    queryKey: ['project-users', projectId],
    queryFn: async (): Promise<ProjectUser[]> => {
      // Mock data - in real implementation, fetch from API
      return [
        {
          id: '1',
          name: 'John Manager',
          email: 'john@example.com',
          role: 'pm',
          assigned_at: '2024-01-15',
          assigned_by: 'System'
        },
      ];
    },
    enabled: !!projectId,
  });
}

export function useForemenUsers() {
  return useQuery({
    queryKey: ['foremen-users'],
    queryFn: async () => {
      const response = await fetch('/api/users?role=foreman&is_active=true');
      if (!response.ok) {
        // Try to get PM users as well if no foremen
        const pmResponse = await fetch('/api/users?role=pm&is_active=true');
        if (!pmResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const pmData = await pmResponse.json();
        return pmData.items || [];
      }
      const data = await response.json();

      // If no foremen, get both foremen and PMs
      if (data.items.length === 0) {
        const allResponse = await fetch('/api/users?is_active=true');
        if (!allResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const allData = await allResponse.json();
        return (allData.items || []).filter((user: any) =>
          user.role === 'foreman' || user.role === 'pm'
        );
      }

      return data.items || [];
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/crews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create team');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: ['project-teams', variables.project_id] });
        queryClient.invalidateQueries({ queryKey: ['project-preparation', variables.project_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['global-teams'] });
      queryClient.invalidateQueries({ queryKey: teamKeys.crews() });
      toast.success(data.message || 'Team created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Specialized hooks
export function useProjectTeams(projectId: string) {
  return useQuery({
    queryKey: ['project-teams', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/crews?project_id=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project teams');
      }
      return response.json();
    },
    enabled: !!projectId,
  });
}

export function useAvailableTeams() {
  const { data: crews, ...rest } = useTeams();

  return {
    ...rest,
    data: crews?.filter(crew => !crew.project_id) || [],
  };
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/crews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update team');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-teams'] });
      queryClient.invalidateQueries({ queryKey: ['global-teams'] });
      queryClient.invalidateQueries({ queryKey: teamKeys.crews() });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Team updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/crews/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete team');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-teams'] });
      queryClient.invalidateQueries({ queryKey: ['global-teams'] });
      queryClient.invalidateQueries({ queryKey: teamKeys.crews() });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Team deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}