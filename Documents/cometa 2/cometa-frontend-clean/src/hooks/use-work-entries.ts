import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workEntriesApi } from "@/lib/api/work-entries";
import { WorkEntryFormData, WorkEntriesQueryParams } from "@/types";
import { toast } from "sonner";

export function useWorkEntries(params?: WorkEntriesQueryParams) {
  return useQuery({
    queryKey: ["work-entries", params],
    queryFn: () => workEntriesApi.getAll(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useWorkEntry(id: string) {
  return useQuery({
    queryKey: ["work-entries", id],
    queryFn: () => workEntriesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateWorkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WorkEntryFormData) => workEntriesApi.create(data),
    onSuccess: (newWorkEntry) => {
      // Invalidate work entries list
      queryClient.invalidateQueries({ queryKey: ["work-entries"] });

      // Invalidate project progress
      queryClient.invalidateQueries({
        queryKey: ["projects", newWorkEntry.project_id, "progress"]
      });

      // Add to cache
      queryClient.setQueryData(["work-entries", newWorkEntry.id], newWorkEntry);

      toast.success("Work entry logged successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create work entry");
    },
  });
}

export function useUpdateWorkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkEntryFormData> }) =>
      workEntriesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["work-entries", id] });

      // Get previous data
      const previousWorkEntry = queryClient.getQueryData(["work-entries", id]);

      // Optimistically update
      queryClient.setQueryData(["work-entries", id], (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousWorkEntry };
    },
    onSuccess: (updatedWorkEntry) => {
      // Update cache with server response
      queryClient.setQueryData(["work-entries", updatedWorkEntry.id], updatedWorkEntry);

      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["work-entries"] });

      // Invalidate project progress
      queryClient.invalidateQueries({
        queryKey: ["projects", updatedWorkEntry.project_id, "progress"]
      });

      toast.success("Work entry updated successfully");
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousWorkEntry) {
        queryClient.setQueryData(["work-entries", variables.id], context.previousWorkEntry);
      }

      toast.error(error.response?.data?.message || "Failed to update work entry");
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["work-entries", variables.id] });
    },
  });
}

export function useDeleteWorkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workEntriesApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["work-entries", deletedId] });

      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ["work-entries"] });

      // Invalidate project progress (we don't know which project, so invalidate all)
      queryClient.invalidateQueries({
        queryKey: ["projects"],
        predicate: (query) => query.queryKey.includes("progress")
      });

      toast.success("Work entry deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete work entry");
    },
  });
}

export function useApproveWorkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workEntriesApi.approve(id),
    onSuccess: (updatedWorkEntry) => {
      // Update cache
      queryClient.setQueryData(["work-entries", updatedWorkEntry.id], updatedWorkEntry);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ["work-entries"] });

      toast.success("Work entry approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve work entry");
    },
  });
}

export function useRejectWorkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      workEntriesApi.reject(id, reason),
    onSuccess: (updatedWorkEntry) => {
      // Update cache
      queryClient.setQueryData(["work-entries", updatedWorkEntry.id], updatedWorkEntry);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ["work-entries"] });

      toast.success("Work entry rejected");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject work entry");
    },
  });
}

export function useWorkEntriesByProject(projectId: string, params?: Omit<WorkEntriesQueryParams, "project_id">) {
  return useQuery({
    queryKey: ["work-entries", "project", projectId, params],
    queryFn: () => workEntriesApi.getByProject(projectId, params),
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useWorkEntriesByUser(userId: string, params?: Omit<WorkEntriesQueryParams, "user_id">) {
  return useQuery({
    queryKey: ["work-entries", "user", userId, params],
    queryFn: () => workEntriesApi.getByUser(userId, params),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUploadWorkEntryPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workEntryId, files }: { workEntryId: string; files: File[] }) =>
      workEntriesApi.uploadPhotos(workEntryId, files),
    onSuccess: (result, { workEntryId }) => {
      // Invalidate work entry to refresh photos
      queryClient.invalidateQueries({ queryKey: ["work-entries", workEntryId] });

      toast.success(`${result.uploaded_count || result.length} photos uploaded successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload photos");
    },
  });
}