'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ActivityLog {
  id: string;
  user_id?: string;
  project_id?: string;
  activity_type: string;
  description: string;
  target_type?: string;
  target_id?: string;
  extra_data?: any;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface ActivitiesResponse {
  activities: ActivityLog[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ActivityFilters {
  user_id?: string;
  project_id?: string;
  activity_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface ActivityStats {
  overview: {
    total_activities: number;
    unique_users: number;
    activity_types_count: number;
    active_projects: number;
  };
  activity_types: Array<{
    activity_type: string;
    count: number;
    percentage: number;
  }>;
  most_active_users: Array<{
    user_id: string;
    user_name: string;
    role: string;
    activity_count: number;
  }>;
  hourly_timeline: Array<{
    hour: number;
    activity_count: number;
  }>;
  project_activity: Array<{
    project_id: string;
    project_name: string;
    activity_count: number;
  }>;
}

export interface CreateActivityData {
  user_id: string;
  project_id?: string;
  activity_type: string;
  description: string;
  target_type?: string;
  target_id?: string;
  extra_data?: any;
  ip_address?: string;
  user_agent?: string;
}

// Query keys
export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (filters: ActivityFilters) => [...activityKeys.lists(), filters] as const,
  stats: (filters: Omit<ActivityFilters, 'page' | 'per_page' | 'search'>) =>
    [...activityKeys.all, 'stats', filters] as const,
};

// Fetch activities with filters
export function useActivities(filters: ActivityFilters = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: async (): Promise<ActivitiesResponse> => {
      const response = await fetch(`/api/activities?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      return response.json();
    },
  });
}

// Fetch activity statistics
export function useActivityStats(filters: Omit<ActivityFilters, 'page' | 'per_page' | 'search'> = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return useQuery({
    queryKey: activityKeys.stats(filters),
    queryFn: async (): Promise<ActivityStats> => {
      const response = await fetch(`/api/activities/stats?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity statistics');
      }
      return response.json();
    },
  });
}

// Log new activity
export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateActivityData) => {
      // Get client IP and user agent
      const activityData = {
        ...data,
        ip_address: data.ip_address || 'unknown',
        user_agent: data.user_agent || navigator.userAgent,
      };

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to log activity');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all activity queries to refresh data
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
    onError: (error: Error) => {
      console.error('Failed to log activity:', error);
      // Don't show toast for activity logging errors as they should be silent
    },
  });
}

// Specialized hooks for common use cases
export function useUserActivities(userId?: string) {
  return useActivities({
    user_id: userId,
    page: 1,
    per_page: 20,
  });
}

export function useProjectActivities(projectId?: string) {
  return useActivities({
    project_id: projectId,
    page: 1,
    per_page: 30,
  });
}

export function useRecentActivities(limit = 10) {
  return useActivities({
    page: 1,
    per_page: limit,
  });
}

// Activity types for filtering
export const ACTIVITY_TYPES = [
  'login',
  'logout',
  'project_created',
  'project_updated',
  'project_deleted',
  'work_entry_created',
  'work_entry_updated',
  'work_entry_approved',
  'work_entry_deleted',
  'crew_created',
  'crew_updated',
  'crew_deleted',
  'user_created',
  'user_updated',
  'user_deleted',
  'equipment_created',
  'equipment_updated',
  'equipment_deleted',
  'equipment_assigned',
  'material_allocated',
  'material_used',
  'expense_created',
  'expense_approved',
  'document_uploaded',
  'document_deleted',
  'report_generated',
  'settings_updated',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

// Helper function to get activity type label
export function getActivityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    login: 'User Login',
    logout: 'User Logout',
    project_created: 'Project Created',
    project_updated: 'Project Updated',
    project_deleted: 'Project Deleted',
    work_entry_created: 'Work Entry Created',
    work_entry_updated: 'Work Entry Updated',
    work_entry_approved: 'Work Entry Approved',
    work_entry_deleted: 'Work Entry Deleted',
    crew_created: 'Team Created',
    crew_updated: 'Team Updated',
    crew_deleted: 'Team Deleted',
    user_created: 'User Created',
    user_updated: 'User Updated',
    user_deleted: 'User Deleted',
    equipment_created: 'Equipment Added',
    equipment_updated: 'Equipment Updated',
    equipment_deleted: 'Equipment Deleted',
    equipment_assigned: 'Equipment Assigned',
    material_allocated: 'Material Allocated',
    material_used: 'Material Used',
    expense_created: 'Expense Created',
    expense_approved: 'Expense Approved',
    document_uploaded: 'Document Uploaded',
    document_deleted: 'Document Deleted',
    report_generated: 'Report Generated',
    settings_updated: 'Settings Updated',
  };

  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to get activity type color
export function getActivityTypeColor(type: string): string {
  const colors: Record<string, string> = {
    login: 'bg-green-100 text-green-800',
    logout: 'bg-gray-100 text-gray-800',
    project_created: 'bg-blue-100 text-blue-800',
    project_updated: 'bg-yellow-100 text-yellow-800',
    project_deleted: 'bg-red-100 text-red-800',
    work_entry_created: 'bg-purple-100 text-purple-800',
    work_entry_updated: 'bg-purple-100 text-purple-800',
    work_entry_approved: 'bg-green-100 text-green-800',
    work_entry_deleted: 'bg-red-100 text-red-800',
    crew_created: 'bg-indigo-100 text-indigo-800',
    crew_updated: 'bg-indigo-100 text-indigo-800',
    crew_deleted: 'bg-red-100 text-red-800',
    user_created: 'bg-emerald-100 text-emerald-800',
    user_updated: 'bg-emerald-100 text-emerald-800',
    user_deleted: 'bg-red-100 text-red-800',
    equipment_created: 'bg-orange-100 text-orange-800',
    equipment_updated: 'bg-orange-100 text-orange-800',
    equipment_deleted: 'bg-red-100 text-red-800',
    equipment_assigned: 'bg-cyan-100 text-cyan-800',
    material_allocated: 'bg-teal-100 text-teal-800',
    material_used: 'bg-teal-100 text-teal-800',
    expense_created: 'bg-rose-100 text-rose-800',
    expense_approved: 'bg-green-100 text-green-800',
    document_uploaded: 'bg-violet-100 text-violet-800',
    document_deleted: 'bg-red-100 text-red-800',
    report_generated: 'bg-sky-100 text-sky-800',
    settings_updated: 'bg-slate-100 text-slate-800',
  };

  return colors[type] || 'bg-gray-100 text-gray-800';
}