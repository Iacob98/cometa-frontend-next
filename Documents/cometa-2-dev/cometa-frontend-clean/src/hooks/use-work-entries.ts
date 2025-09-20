import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  workEntriesApi,
  type WorkEntry,
  type WorkEntryFilters,
  type CreateWorkEntryRequest,
  type WorkStage,
  type Photo,
  type PaginatedResponse,
} from "@/lib/api-client";

// Query keys
export const workEntryKeys = {
  all: ["work-entries"] as const,
  lists: () => [...workEntryKeys.all, "list"] as const,
  list: (filters: WorkEntryFilters) => [...workEntryKeys.lists(), filters] as const,
  details: () => [...workEntryKeys.all, "detail"] as const,
  detail: (id: string) => [...workEntryKeys.details(), id] as const,
  stages: () => [...workEntryKeys.all, "stages"] as const,
};

// Hooks
export function useWorkEntries(filters?: WorkEntryFilters) {
  return useQuery({
    queryKey: workEntryKeys.list(filters || {}),
    queryFn: () => workEntriesApi.getWorkEntries(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - work entries change more frequently
  });
}

export function useWorkEntry(id: string) {
  return useQuery({
    queryKey: workEntryKeys.detail(id),
    queryFn: () => workEntriesApi.getWorkEntry(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useWorkStages() {
  return useQuery({
    queryKey: workEntryKeys.stages(),
    queryFn: () => workEntriesApi.getStages(),
    staleTime: 30 * 60 * 1000, // 30 minutes - stages don't change often
  });
}

export function useCreateWorkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkEntryRequest) => workEntriesApi.createWorkEntry(data),
    onSuccess: (newWorkEntry) => {
      // Invalidate work entries lists
      queryClient.invalidateQueries({ queryKey: workEntryKeys.lists() });

      // Add to cache
      queryClient.setQueryData(workEntryKeys.detail(newWorkEntry.id), newWorkEntry);

      toast.success("Work entry created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create work entry: ${error.message}`);
    },
  });
}

export function useUpdateWorkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWorkEntryRequest> }) =>
      workEntriesApi.updateWorkEntry(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: workEntryKeys.detail(id) });

      const previousWorkEntry = queryClient.getQueryData(workEntryKeys.detail(id));

      queryClient.setQueryData(workEntryKeys.detail(id), (old: WorkEntry | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousWorkEntry };
    },
    onError: (error, { id }, context) => {
      if (context?.previousWorkEntry) {
        queryClient.setQueryData(workEntryKeys.detail(id), context.previousWorkEntry);
      }
      toast.error(`Failed to update work entry: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workEntryKeys.lists() });
      toast.success("Work entry updated successfully");
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: workEntryKeys.detail(id) });
    },
  });
}

export function useApproveWorkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workEntriesApi.approveWorkEntry(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: workEntryKeys.detail(id) });

      const previousWorkEntry = queryClient.getQueryData(workEntryKeys.detail(id));

      // Optimistically update approval status
      queryClient.setQueryData(workEntryKeys.detail(id), (old: WorkEntry | undefined) => {
        if (!old) return old;
        return {
          ...old,
          approved_at: new Date().toISOString(),
          // approved_by will be set by the server response
        };
      });

      return { previousWorkEntry };
    },
    onError: (error, id, context) => {
      if (context?.previousWorkEntry) {
        queryClient.setQueryData(workEntryKeys.detail(id), context.previousWorkEntry);
      }
      toast.error(`Failed to approve work entry: ${error.message}`);
    },
    onSuccess: (approvedWorkEntry) => {
      // Update cache with server response
      queryClient.setQueryData(workEntryKeys.detail(approvedWorkEntry.id), approvedWorkEntry);

      // Invalidate lists to reflect approval
      queryClient.invalidateQueries({ queryKey: workEntryKeys.lists() });

      toast.success("Work entry approved successfully");
    },
  });
}

export function useDeleteWorkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workEntriesApi.deleteWorkEntry(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: workEntryKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: workEntryKeys.lists() });
      toast.success("Work entry deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete work entry: ${error.message}`);
    },
  });
}

export function useUploadWorkEntryPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workEntryId, files }: { workEntryId: string; files: File[] }) =>
      workEntriesApi.uploadPhotos(workEntryId, files),
    onSuccess: (photos, { workEntryId }) => {
      // Update the work entry cache with new photos
      queryClient.setQueryData(workEntryKeys.detail(workEntryId), (old: WorkEntry | undefined) => {
        if (!old) return old;
        return {
          ...old,
          photos: [...(old.photos || []), ...photos],
        };
      });

      // Invalidate work entries list to ensure consistency
      queryClient.invalidateQueries({ queryKey: workEntryKeys.lists() });

      toast.success(`${photos.length} photo(s) uploaded successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to upload photos: ${error.message}`);
    },
  });
}

// Specialized hooks for common use cases
export function useMyWorkEntries(userId?: string) {
  return useWorkEntries({
    user_id: userId,
    page: 1,
    per_page: 20,
  });
}

export function useProjectWorkEntries(projectId?: string) {
  return useWorkEntries({
    project_id: projectId,
    page: 1,
    per_page: 50,
  });
}

export function usePendingApprovals(userId?: string) {
  return useWorkEntries({
    approved: false,
    page: 1,
    per_page: 20,
  });
}