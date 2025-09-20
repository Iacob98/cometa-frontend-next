import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  usersApi,
  type User,
  type PaginatedResponse,
} from "@/lib/api-client";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: any) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Hooks
export function useUsers(filters?: { role?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: userKeys.list(filters || {}),
    queryFn: () => usersApi.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => usersApi.createUser(data),
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Add the new user to the cache
      queryClient.setQueryData(userKeys.detail(newUser.id), newUser);

      toast.success("User created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      usersApi.updateUser(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(userKeys.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(userKeys.detail(id), (old: User | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      // Return a context object with the snapshotted value
      return { previousUser };
    },
    onError: (error, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser);
      }
      toast.error(`Failed to update user: ${error.message}`);
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User updated successfully");
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedId) });

      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success("User deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });
}

// Specialized hooks for common use cases
export function useWorkers() {
  return useUsers({
    role: "crew,worker,foreman",
    page: 1,
    per_page: 100,
  });
}

export function useForemen() {
  return useUsers({
    role: "foreman",
    page: 1,
    per_page: 50,
  });
}

export function useProjectManagers() {
  return useUsers({
    role: "pm",
    page: 1,
    per_page: 50,
  });
}