import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Cabinet {
  id: string;
  code: string;
  name: string;
  address?: string;
  notes?: string;
  segment_count?: number;
  total_length?: number;
  status?: string;
}

export interface Segment {
  id: string;
  cabinet_id: string;
  cabinet_code: string;
  name: string;
  length_planned_m?: number;
  surface?: string;
  area?: string;
  depth_req_m?: number;
  width_req_m?: number;
  status?: string;
}

export interface CreateCabinetData {
  project_id: string;
  code: string;
  name: string;
  address?: string;
  notes?: string;
}

export interface UpdateCabinetData {
  id: string;
  code?: string;
  name?: string;
  address?: string;
  notes?: string;
  status?: string;
}

const api = {
  getCabinets: async (projectId: string): Promise<Cabinet[]> => {
    const response = await fetch(`/api/zone-layout/cabinets?project_id=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch cabinets');
    }

    return response.json();
  },

  createCabinet: async (data: CreateCabinetData): Promise<{ success: boolean; cabinet_id: string; message: string }> => {
    const response = await fetch('/api/zone-layout/cabinets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create cabinet');
    }

    return response.json();
  },

  updateCabinet: async (data: UpdateCabinetData): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/zone-layout/cabinets/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update cabinet');
    }

    return response.json();
  },

  deleteCabinet: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/zone-layout/cabinets/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete cabinet');
    }

    return response.json();
  },

  getSegments: async (projectId: string): Promise<Segment[]> => {
    const response = await fetch(`/api/zone-layout/segments?project_id=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch segments');
    }

    return response.json();
  },
};

export function useCabinets(projectId: string) {
  return useQuery({
    queryKey: ['cabinets', projectId],
    queryFn: () => api.getCabinets(projectId),
    enabled: !!projectId,
  });
}

export function useCreateCabinet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createCabinet,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cabinets', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation', variables.project_id] });
      toast.success(data.message || 'Cabinet created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCabinet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateCabinet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinets'] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Cabinet updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCabinet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteCabinet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinets'] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Cabinet deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSegments(projectId: string) {
  return useQuery({
    queryKey: ['segments', projectId],
    queryFn: () => api.getSegments(projectId),
    enabled: !!projectId,
  });
}