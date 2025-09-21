import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ProjectPreparation {
  project: {
    id: string;
    name: string;
    customer?: string;
    city?: string;
    address?: string;
    contact_24h?: string;
    start_date?: string;
    end_date_plan?: string;
    status: string;
    total_length_m: number;
    base_rate_per_m: number;
    pm_user_id?: string;
    project_manager?: string;
  };
  potential_revenue: number;
  preparation_progress: number;
  steps_summary: {
    utility_contacts: number;
    facilities: number;
    housing_units: number;
    crews: number;
    materials: number;
    equipment: number;
  };
}

export interface UtilityContact {
  id: string;
  kind: string;
  organization: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  notes?: string;
}

export interface Facility {
  id: string;
  type: string;
  rent_daily_eur: number;
  service_freq?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  location_text?: string;
  supplier_name?: string;
}

export interface HousingUnit {
  id: string;
  address: string;
  rooms_total: number;
  beds_total: number;
  rent_daily_eur: number;
  status: string;
}

export interface CreateUtilityContactData {
  project_id: string;
  kind: string;
  organization: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  notes?: string;
}

export interface CreateFacilityData {
  project_id: string;
  type: string;
  supplier_id?: string;
  rent_daily_eur: number;
  service_freq?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  location_text?: string;
}

export interface CreateHousingData {
  project_id: string;
  address: string;
  rooms_total: number;
  beds_total: number;
  rent_daily_eur: number;
  status: string;
}

export interface UpdateProjectStatusData {
  project_id: string;
  status: string;
  reason?: string;
}

export interface UpdateUtilityContactData {
  id: string;
  kind?: string;
  organization?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  notes?: string;
}

export interface UpdateFacilityData {
  id: string;
  type?: string;
  supplier_id?: string;
  rent_daily_eur?: number;
  service_freq?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  location_text?: string;
}

export interface UpdateHousingData {
  id: string;
  address?: string;
  rooms_total?: number;
  beds_total?: number;
  rent_daily_eur?: number;
  status?: string;
}

export interface ProjectPlan {
  id: string;
  title: string;
  description?: string;
  plan_type: string;
  filename: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface CreateProjectPlanData {
  project_id: string;
  title: string;
  description?: string;
  plan_type: string;
  file: File;
}

const api = {
  getProjectPreparation: async (projectId: string): Promise<ProjectPreparation> => {
    const response = await fetch(`/api/project-preparation?project_id=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch project preparation data');
    }

    return response.json();
  },

  updateProjectStatus: async (data: UpdateProjectStatusData): Promise<{ success: boolean; message: string }> => {
    const response = await fetch('/api/project-preparation', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project status');
    }

    return response.json();
  },

  getUtilityContacts: async (projectId: string): Promise<UtilityContact[]> => {
    const response = await fetch(`/api/project-preparation/utility-contacts?project_id=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch utility contacts');
    }

    return response.json();
  },

  createUtilityContact: async (data: CreateUtilityContactData): Promise<{ success: boolean; contact_id: string; message: string }> => {
    const response = await fetch('/api/project-preparation/utility-contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create utility contact');
    }

    return response.json();
  },

  getFacilities: async (projectId: string): Promise<Facility[]> => {
    const response = await fetch(`/api/project-preparation/facilities?project_id=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch facilities');
    }

    return response.json();
  },

  createFacility: async (data: CreateFacilityData): Promise<{ success: boolean; facility_id: string; message: string }> => {
    const response = await fetch('/api/project-preparation/facilities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create facility');
    }

    return response.json();
  },

  getHousingUnits: async (projectId: string): Promise<HousingUnit[]> => {
    const response = await fetch(`/api/project-preparation/housing?project_id=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch housing units');
    }

    return response.json();
  },

  createHousingUnit: async (data: CreateHousingData): Promise<{ success: boolean; housing_id: string; message: string }> => {
    const response = await fetch('/api/project-preparation/housing', {
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

  // UPDATE methods
  updateUtilityContact: async (data: UpdateUtilityContactData): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/project-preparation/utility-contacts/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update utility contact');
    }

    return response.json();
  },

  updateFacility: async (data: UpdateFacilityData): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/project-preparation/facilities/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update facility');
    }

    return response.json();
  },

  updateHousingUnit: async (data: UpdateHousingData): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/project-preparation/housing/${data.id}`, {
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

  // DELETE methods
  deleteUtilityContact: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/project-preparation/utility-contacts/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete utility contact');
    }

    return response.json();
  },

  deleteFacility: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/project-preparation/facilities/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete facility');
    }

    return response.json();
  },

  deleteHousingUnit: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/project-preparation/housing/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete housing unit');
    }

    return response.json();
  },

  // Project Plans API
  getProjectPlans: async (projectId: string): Promise<ProjectPlan[]> => {
    const response = await fetch(`/api/project-preparation/plans?project_id=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch project plans');
    }

    return response.json();
  },

  createProjectPlan: async (data: CreateProjectPlanData): Promise<{ success: boolean; plan_id: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('plan_type', data.plan_type);
    formData.append('project_id', data.project_id);

    const response = await fetch('/api/project-preparation/plans', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload plan');
    }

    return response.json();
  },

  deleteProjectPlan: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/project-preparation/plans/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete plan');
    }

    return response.json();
  },
};

export function useProjectPreparation(projectId: string) {
  return useQuery({
    queryKey: ['project-preparation', projectId],
    queryFn: () => api.getProjectPreparation(projectId),
    enabled: !!projectId,
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateProjectStatus,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-preparation', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(data.message || 'Project status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUtilityContacts(projectId: string) {
  return useQuery({
    queryKey: ['utility-contacts', projectId],
    queryFn: () => api.getUtilityContacts(projectId),
    enabled: !!projectId,
  });
}

export function useCreateUtilityContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createUtilityContact,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['utility-contacts', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation', variables.project_id] });
      toast.success(data.message || 'Utility contact created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useFacilities(projectId: string) {
  return useQuery({
    queryKey: ['facilities', projectId],
    queryFn: () => api.getFacilities(projectId),
    enabled: !!projectId,
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createFacility,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facilities', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation', variables.project_id] });
      toast.success(data.message || 'Facility created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

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

// UPDATE hooks
export function useUpdateUtilityContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateUtilityContact,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['utility-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Utility contact updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateFacility,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Facility updated successfully');
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

// DELETE hooks
export function useDeleteUtilityContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteUtilityContact,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['utility-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Utility contact deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteFacility,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Facility deleted successfully');
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

// Project Plans hooks
export function useProjectPlans(projectId: string) {
  return useQuery({
    queryKey: ['project-plans', projectId],
    queryFn: () => api.getProjectPlans(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProjectPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createProjectPlan,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-plans', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation', variables.project_id] });
      toast.success(data.message || 'Plan uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteProjectPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteProjectPlan,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-plans'] });
      queryClient.invalidateQueries({ queryKey: ['project-preparation'] });
      toast.success(data.message || 'Plan deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}