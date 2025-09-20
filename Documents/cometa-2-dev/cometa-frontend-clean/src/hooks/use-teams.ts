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

// Specialized hooks
export function useProjectTeams(projectId: string) {
  const { data: crews, ...rest } = useTeams();

  return {
    ...rest,
    data: crews?.filter(crew => crew.project_id === projectId) || [],
  };
}

export function useAvailableTeams() {
  const { data: crews, ...rest } = useTeams();

  return {
    ...rest,
    data: crews?.filter(crew => !crew.project_id) || [],
  };
}