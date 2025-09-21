import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface HousingUnit {
  id: string;
  project_id: string;
  address: string;
  rooms_total: number;
  beds_total: number;
  rent_daily_eur: number;
  status: string;
}

export interface CreateHousingUnitData {
  project_id: string;
  address: string;
  rooms_total: number;
  beds_total: number;
  rent_daily_eur: number;
  status: string;
}

export interface UpdateHousingUnitData {
  id: string;
  address?: string;
  rooms_total?: number;
  beds_total?: number;
  rent_daily_eur?: number;
  status?: string;
}

const api = {
  getHousingUnits: async (projectId: string): Promise<HousingUnit[]> => {
    const response = await fetch(`/api/housing-units?project_id=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch housing units');
    }

    return response.json();
  },

  createHousingUnit: async (data: CreateHousingUnitData): Promise<{ success: boolean; housing_unit_id: string; message: string }> => {
    const response = await fetch('/api/housing-units', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create housing unit');
    }

    return response.json();
  },

  updateHousingUnit: async (data: UpdateHousingUnitData): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/housing-units/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update housing unit');
    }

    return response.json();
  },

  deleteHousingUnit: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/housing-units/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete housing unit');
    }

    return response.json();
  },
};

export function useHousingUnits(projectId: string) {
  return useQuery({
    queryKey: ['housing-units', projectId],
    queryFn: () => api.getHousingUnits(projectId),
    enabled: !!projectId,
  });
}

export function useCreateHousingUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createHousingUnit,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['housing-units', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation', variables.project_id] });
      toast.success(data.message || 'Housing unit created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateHousingUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateHousingUnit,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['housing-units'] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Housing unit updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteHousingUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteHousingUnit,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['housing-units'] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Housing unit deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}