import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { ProjectFormData, ProjectsQueryParams } from "@/types";
import { toast } from "sonner";

export function useProjects(params?: ProjectsQueryParams) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectsApi.getAll(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectFormData) => projectsApi.create(data),
    onSuccess: (newProject) => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Add to cache
      queryClient.setQueryData(["projects", newProject.id], newProject);

      toast.success("Project created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create project");
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectFormData> }) =>
      projectsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["projects", id] });

      // Get previous data
      const previousProject = queryClient.getQueryData(["projects", id]);

      // Optimistically update
      queryClient.setQueryData(["projects", id], (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousProject };
    },
    onSuccess: (updatedProject) => {
      // Update cache with server response
      queryClient.setQueryData(["projects", updatedProject.id], updatedProject);

      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      toast.success("Project updated successfully");
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousProject) {
        queryClient.setQueryData(["projects", variables.id], context.previousProject);
      }

      toast.error(error.response?.data?.message || "Failed to update project");
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["projects", deletedId] });

      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      toast.success("Project deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete project");
    },
  });
}

export function useProjectProgress(id: string) {
  return useQuery({
    queryKey: ["projects", id, "progress"],
    queryFn: () => projectsApi.getProgress(id),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useDashboardStats(userId?: string) {
  return useQuery({
    queryKey: ["dashboard", "stats", userId],
    queryFn: () => projectsApi.getDashboardStats(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

export function useProjectTeams(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "teams"],
    queryFn: () => projectsApi.getProjectTeams(projectId),
    enabled: !!projectId,
  });
}

export function useAssignTeamToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, teamId }: { projectId: string; teamId: string }) =>
      projectsApi.assignTeam(projectId, teamId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "teams"] });
      toast.success("Team assigned to project successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign team");
    },
  });
}