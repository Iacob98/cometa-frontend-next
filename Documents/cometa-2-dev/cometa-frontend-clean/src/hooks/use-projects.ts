import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  projectsApi,
  type Project,
  type ProjectFilters,
  type CreateProjectRequest,
  type UpdateProjectRequest,
  type PaginatedResponse,
} from "@/lib/api-client";

// Query keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Hooks
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters || {}),
    queryFn: () => projectsApi.getProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.getProject(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectsApi.createProject(data),
    onSuccess: (newProject) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      // Add the new project to the cache
      queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);

      toast.success("Project created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectsApi.updateProject(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(projectKeys.detail(id), (old: Project | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      // Return a context object with the snapshotted value
      return { previousProject };
    },
    onError: (error, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(id), context.previousProject);
      }
      toast.error(`Failed to update project: ${error.message}`);
    },
    onSuccess: (updatedProject) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project updated successfully");
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });

      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      toast.success("Project deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });
}

// Optimistic mutations for better UX
export function useOptimisticProjectUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectsApi.updateProject(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      const previousProject = queryClient.getQueryData(projectKeys.detail(id));

      queryClient.setQueryData(projectKeys.detail(id), (old: Project | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      // Also update in lists if present
      queryClient.setQueriesData(
        { queryKey: projectKeys.lists() },
        (old: PaginatedResponse<Project> | undefined) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((project) =>
              project.id === id ? { ...project, ...data } : project
            ),
          };
        }
      );

      return { previousProject };
    },
    onError: (error, { id }, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(id), context.previousProject);
      }
      // Invalidate lists to revert optimistic updates
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.error(`Failed to update project: ${error.message}`);
    },
    onSuccess: () => {
      toast.success("Project updated successfully");
    },
  });
}