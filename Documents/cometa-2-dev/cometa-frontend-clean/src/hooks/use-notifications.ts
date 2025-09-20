import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCallback, useEffect, useRef } from "react";
import {
  notificationsApi,
  notificationPreferencesApi,
  notificationTemplatesApi,
  wsApi,
  type Notification,
  type NotificationFilters,
  type CreateNotificationRequest,
  type NotificationPreferences,
  type UpdateNotificationPreferencesRequest,
  type NotificationTemplate,
  type WebSocketMessage,
  type RealtimeEvent,
  type PaginatedResponse,
} from "@/lib/api-client";

// Query keys
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
  details: () => [...notificationKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, "unread-count", userId] as const,
  preferences: (userId: string) => [...notificationKeys.all, "preferences", userId] as const,
  templates: () => [...notificationKeys.all, "templates"] as const,
};

// Notification Hooks
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationKeys.list(filters || {}),
    queryFn: () => notificationsApi.getNotifications(filters),
    staleTime: 30 * 1000, // 30 seconds - notifications need to be fresh
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationsApi.getNotification(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useUnreadNotificationCount(userId: string) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: () => notificationsApi.getUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    staleTime: 0, // Always consider stale for real-time feel
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNotificationRequest) => notificationsApi.createNotification(data),
    onSuccess: (newNotification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(newNotification.user_id)
      });
      queryClient.setQueryData(notificationKeys.detail(newNotification.id), newNotification);

      // Show toast for high priority notifications
      if (newNotification.priority === "high" || newNotification.priority === "urgent") {
        toast.info(newNotification.title, {
          description: newNotification.body,
        });
      }
    },
    onError: (error) => {
      toast.error(`Failed to create notification: ${error.message}`);
    },
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.detail(id) });
      const previousNotification = queryClient.getQueryData(notificationKeys.detail(id));

      queryClient.setQueryData(notificationKeys.detail(id), (old: Notification | undefined) => {
        if (!old) return old;
        return { ...old, read_at: new Date().toISOString() };
      });

      return { previousNotification };
    },
    onError: (error, id, context) => {
      if (context?.previousNotification) {
        queryClient.setQueryData(notificationKeys.detail(id), context.previousNotification);
      }
      toast.error(`Failed to mark notification as read: ${error.message}`);
    },
    onSuccess: (updatedNotification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(updatedNotification.user_id)
      });
    },
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(id) });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => notificationsApi.markAllAsRead(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      toast.error(`Failed to mark all notifications as read: ${error.message}`);
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: notificationKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success("Notification deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete notification: ${error.message}`);
    },
  });
}

// Notification Preferences Hooks
export function useNotificationPreferences(userId: string) {
  return useQuery({
    queryKey: notificationKeys.preferences(userId),
    queryFn: () => notificationPreferencesApi.getPreferences(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateNotificationPreferencesRequest }) =>
      notificationPreferencesApi.updatePreferences(userId, data),
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(
        notificationKeys.preferences(updatedPreferences.user_id),
        updatedPreferences
      );
      toast.success("Notification preferences updated");
    },
    onError: (error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });
}

// Notification Templates Hooks
export function useNotificationTemplates() {
  return useQuery({
    queryKey: notificationKeys.templates(),
    queryFn: () => notificationTemplatesApi.getTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes - templates don't change often
  });
}

export function useUpdateNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationTemplate> }) =>
      notificationTemplatesApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.templates() });
      toast.success("Notification template updated");
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

// WebSocket Integration Hook
export function useWebSocketNotifications(userId: string, enabled = true) {
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const handleNotification = useCallback((notification: Notification) => {
    // Update notification queries
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });

    // Add to cache
    queryClient.setQueryData(notificationKeys.detail(notification.id), notification);

    // Show toast for important notifications
    if (notification.priority === "high" || notification.priority === "urgent") {
      toast.info(notification.title, {
        description: notification.body,
        action: notification.priority === "urgent" ? {
          label: "View",
          onClick: () => {
            // Could navigate to notification detail or relevant page
            console.log("Navigate to notification:", notification.id);
          }
        } : undefined,
      });
    }
  }, [queryClient, userId]);

  const handleRealtimeUpdate = useCallback((event: RealtimeEvent) => {
    // Handle real-time updates to various entities
    switch (event.entity_type) {
      case "project":
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        break;
      case "work_entry":
        queryClient.invalidateQueries({ queryKey: ["work-entries"] });
        break;
      case "material_allocation":
        queryClient.invalidateQueries({ queryKey: ["material-allocations"] });
        break;
      case "house":
        queryClient.invalidateQueries({ queryKey: ["houses"] });
        break;
      default:
        // Generic invalidation for unknown entity types
        queryClient.invalidateQueries();
    }

    // Show toast for critical updates
    if (event.type === "status_changed" || event.type === "assignment_changed") {
      toast.info("Update received", {
        description: `${event.entity_type} has been updated`,
      });
    }
  }, [queryClient]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const connect = async () => {
      try {
        await wsApi.connect(userId);
        reconnectAttempts.current = 0;

        // Subscribe to notification events
        wsApi.subscribe("notification", handleNotification);
        wsApi.subscribe("realtime_update", handleRealtimeUpdate);

      } catch (error) {
        console.error("WebSocket connection failed:", error);

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;

          setTimeout(() => {
            connect();
          }, delay);
        }
      }
    };

    connect();

    return () => {
      wsApi.unsubscribe("notification", handleNotification);
      wsApi.unsubscribe("realtime_update", handleRealtimeUpdate);
      wsApi.disconnect();
    };
  }, [userId, enabled, handleNotification, handleRealtimeUpdate]);

  return {
    sendMessage: (type: string, data: any) => wsApi.send(type, data),
    subscribe: (messageType: string, handler: (data: any) => void) => wsApi.subscribe(messageType, handler),
    unsubscribe: (messageType: string, handler: (data: any) => void) => wsApi.unsubscribe(messageType, handler),
  };
}

// Specialized hooks for common notification scenarios
export function useUserNotifications(userId: string) {
  return useNotifications({
    user_id: userId,
    page: 1,
    per_page: 20,
  });
}

export function useUnreadNotifications(userId: string) {
  return useNotifications({
    user_id: userId,
    read: false,
    page: 1,
    per_page: 50,
  });
}

export function useUrgentNotifications(userId: string) {
  return useNotifications({
    user_id: userId,
    priority: "urgent",
    read: false,
    page: 1,
    per_page: 10,
  });
}

export function useRecentNotifications(userId: string) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return useNotifications({
    user_id: userId,
    created_after: yesterday.toISOString(),
    page: 1,
    per_page: 20,
  });
}

// Helper hook for notification actions
export function useNotificationActions() {
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  const createNotification = useCreateNotification();

  return {
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    delete: deleteNotification.mutate,
    create: createNotification.mutate,
    isLoading: markAsRead.isPending || markAllAsRead.isPending || deleteNotification.isPending || createNotification.isPending,
  };
}