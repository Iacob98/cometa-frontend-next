import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface MaterialAllocation {
  id: string;
  material_id: string;
  project_id?: string;
  crew_id?: string;
  allocated_qty: number;
  used_qty: number;
  allocation_date: string;
  return_date?: string;
  status: 'allocated' | 'partially_used' | 'fully_used' | 'returned';
  notes?: string;
  allocated_by?: string;
  material: {
    name: string;
    unit: string;
    default_price_eur: number;
  };
  project_name?: string;
  crew_name?: string;
  allocated_by_name: string;
  remaining_qty: number;
  total_value: number;
}

export interface CreateAllocationData {
  material_id: string;
  project_id?: string;
  crew_id?: string;
  allocated_qty: number;
  allocation_date: string;
  notes?: string;
  allocated_by?: string;
}

export interface UpdateAllocationData {
  used_qty?: number;
  status?: string;
  notes?: string;
  return_date?: string;
}

interface AllocationsFilters {
  project_id?: string;
  crew_id?: string;
  status?: string;
  material_id?: string;
}

const api = {
  getAllocations: async (filters?: AllocationsFilters): Promise<MaterialAllocation[]> => {
    const params = new URLSearchParams();
    if (filters?.project_id) params.append('project_id', filters.project_id);
    if (filters?.crew_id) params.append('crew_id', filters.crew_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.material_id) params.append('material_id', filters.material_id);

    const url = `/api/materials/allocations${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch allocations');
    }

    return response.json();
  },

  getAllocation: async (id: string): Promise<MaterialAllocation> => {
    const response = await fetch(`/api/materials/allocations/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch allocation');
    }

    return response.json();
  },

  createAllocation: async (data: CreateAllocationData): Promise<{ success: boolean; allocation_id: string; message: string }> => {
    const response = await fetch('/api/materials/allocations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create allocation');
    }

    return response.json();
  },

  updateAllocation: async (id: string, data: UpdateAllocationData): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/materials/allocations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update allocation');
    }

    return response.json();
  },

  deleteAllocation: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/materials/allocations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete allocation');
    }

    return response.json();
  },
};

export function useAllocations(filters?: AllocationsFilters) {
  return useQuery({
    queryKey: ['allocations', filters],
    queryFn: () => api.getAllocations(filters),
  });
}

export function useAllocation(id: string) {
  return useQuery({
    queryKey: ['allocation', id],
    queryFn: () => api.getAllocation(id),
    enabled: !!id,
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createAllocation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(data.message || 'Allocation created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAllocationData }) =>
      api.updateAllocation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['allocation', id] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Allocation updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Allocation deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}