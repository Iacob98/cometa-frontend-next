import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Equipment {
  id: string;
  type: 'machine' | 'tool' | 'measuring_device';
  name: string;
  inventory_no?: string;
  owned: boolean;
  status: 'available' | 'in_use' | 'maintenance' | 'broken';
  purchase_price_eur: number;
  rental_price_per_day_eur: number;
  rental_price_per_hour_eur: number;
  current_location?: string;
}

export interface EquipmentAssignment {
  id: string;
  equipment_id: string;
  project_id: string;
  cabinet_id?: string;
  crew_id?: string;
  from_ts: string;
  to_ts?: string;
  is_permanent: boolean;
  rental_cost_per_day: number;
  equipment: {
    name: string;
    type: string;
    inventory_no?: string;
  };
  project_name?: string;
  crew_name?: string;
  is_active: boolean;
}

export interface CreateEquipmentData {
  type: string;
  name: string;
  inventory_no?: string;
  owned?: boolean;
  status?: string;
  purchase_price_eur?: number;
  rental_price_per_day_eur?: number;
  rental_price_per_hour_eur?: number;
  current_location?: string;
}

export interface CreateAssignmentData {
  equipment_id: string;
  project_id: string;
  cabinet_id?: string;
  crew_id?: string;
  from_ts: string;
  to_ts?: string;
  is_permanent?: boolean;
  rental_cost_per_day?: number;
}

interface EquipmentFilters {
  type?: string;
  status?: string;
  owned?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

interface AssignmentFilters {
  equipment_id?: string;
  project_id?: string;
  crew_id?: string;
  active_only?: boolean;
}

const api = {
  getEquipment: async (filters?: EquipmentFilters): Promise<{ items: Equipment[]; total: number; page: number; per_page: number; total_pages: number }> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.owned) params.append('owned', filters.owned);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());

    const url = `/api/equipment${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch equipment');
    }

    return response.json();
  },

  getEquipmentItem: async (id: string): Promise<Equipment> => {
    const response = await fetch(`/api/equipment/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch equipment');
    }

    return response.json();
  },

  createEquipment: async (data: CreateEquipmentData): Promise<Equipment> => {
    const response = await fetch('/api/equipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create equipment');
    }

    return response.json();
  },

  updateEquipment: async (id: string, data: Partial<Equipment>): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/equipment/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update equipment');
    }

    return response.json();
  },

  deleteEquipment: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/equipment/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete equipment');
    }

    return response.json();
  },

  getAssignments: async (filters?: AssignmentFilters): Promise<EquipmentAssignment[]> => {
    const params = new URLSearchParams();
    if (filters?.equipment_id) params.append('equipment_id', filters.equipment_id);
    if (filters?.project_id) params.append('project_id', filters.project_id);
    if (filters?.crew_id) params.append('crew_id', filters.crew_id);
    if (filters?.active_only) params.append('active_only', filters.active_only.toString());

    const url = `/api/equipment/assignments${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch assignments');
    }

    return response.json();
  },

  createAssignment: async (data: CreateAssignmentData): Promise<{ success: boolean; assignment_id: string; message: string }> => {
    const response = await fetch('/api/equipment/assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create assignment');
    }

    return response.json();
  },
};

export function useEquipment(filters?: EquipmentFilters) {
  return useQuery({
    queryKey: ['equipment', filters],
    queryFn: () => api.getEquipment(filters),
  });
}

export function useEquipmentItem(id: string) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => api.getEquipmentItem(id),
    enabled: !!id,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Equipment> }) =>
      api.updateEquipment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', id] });
      toast.success('Equipment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useEquipmentAssignments(filters?: AssignmentFilters) {
  return useQuery({
    queryKey: ['equipment-assignments', filters],
    queryFn: () => api.getAssignments(filters),
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createAssignment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success(data.message || 'Assignment created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}