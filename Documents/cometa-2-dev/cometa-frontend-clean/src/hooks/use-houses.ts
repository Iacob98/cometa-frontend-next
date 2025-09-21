import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  housesApi,
  appointmentsApi,
  type House,
  type HouseAppointment,
  type HouseFilters,
  type AppointmentFilters,
  type CreateHouseRequest,
  type UpdateHouseRequest,
  type ScheduleAppointmentRequest,
  type StartConnectionRequest,
  type CompleteConnectionRequest,
  type PaginatedResponse,
} from "@/lib/api-client";

// Query keys
export const houseKeys = {
  all: ["houses"] as const,
  lists: () => [...houseKeys.all, "list"] as const,
  list: (filters: HouseFilters) => [...houseKeys.lists(), filters] as const,
  details: () => [...houseKeys.all, "detail"] as const,
  detail: (id: string) => [...houseKeys.details(), id] as const,
  project: (projectId: string) => [...houseKeys.all, "project", projectId] as const,
  team: (teamId: string) => [...houseKeys.all, "team", teamId] as const,
};

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: AppointmentFilters) => [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

// House Hooks
export function useHouses(filters?: HouseFilters) {
  return useQuery({
    queryKey: houseKeys.list(filters || {}),
    queryFn: () => housesApi.getHouses(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useHouse(id: string) {
  return useQuery({
    queryKey: houseKeys.detail(id),
    queryFn: () => housesApi.getHouse(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useProjectHouses(projectId: string) {
  return useQuery({
    queryKey: houseKeys.project(projectId),
    queryFn: () => housesApi.getProjectHouses(projectId),
    enabled: !!projectId,
    staleTime: 3 * 60 * 1000,
  });
}

export function useTeamHouses(teamId: string) {
  return useQuery({
    queryKey: houseKeys.team(teamId),
    queryFn: () => housesApi.getTeamHouses(teamId),
    enabled: !!teamId,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHouseRequest) => housesApi.createHouse(data),
    onSuccess: (newHouse) => {
      queryClient.invalidateQueries({ queryKey: houseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.project(newHouse.project_id) });
      queryClient.setQueryData(houseKeys.detail(newHouse.id), newHouse);
      toast.success("House created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create house: ${error.message}`);
    },
  });
}

export function useUpdateHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHouseRequest }) =>
      housesApi.updateHouse(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: houseKeys.detail(id) });
      const previousHouse = queryClient.getQueryData(houseKeys.detail(id));

      queryClient.setQueryData(houseKeys.detail(id), (old: House | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousHouse };
    },
    onError: (error, { id }, context) => {
      if (context?.previousHouse) {
        queryClient.setQueryData(houseKeys.detail(id), context.previousHouse);
      }
      toast.error(`Failed to update house: ${error.message}`);
    },
    onSuccess: (updatedHouse) => {
      queryClient.invalidateQueries({ queryKey: houseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.project(updatedHouse.project_id) });
      if (updatedHouse.assigned_team_id) {
        queryClient.invalidateQueries({ queryKey: houseKeys.team(updatedHouse.assigned_team_id) });
      }
      toast.success("House updated successfully");
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: houseKeys.detail(id) });
    },
  });
}

export function useDeleteHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => housesApi.deleteHouse(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: houseKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: houseKeys.lists() });
      // Also invalidate project and team queries
      queryClient.invalidateQueries({ queryKey: houseKeys.all });
      toast.success("House deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete house: ${error.message}`);
    },
  });
}

export function useStartConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartConnectionRequest) => housesApi.startConnection(data),
    onSuccess: (updatedHouse) => {
      queryClient.setQueryData(houseKeys.detail(updatedHouse.id), updatedHouse);
      queryClient.invalidateQueries({ queryKey: houseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.project(updatedHouse.project_id) });
      if (updatedHouse.assigned_team_id) {
        queryClient.invalidateQueries({ queryKey: houseKeys.team(updatedHouse.assigned_team_id) });
      }
      toast.success("Connection work started successfully");
    },
    onError: (error) => {
      toast.error(`Failed to start connection: ${error.message}`);
    },
  });
}

export function useCompleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompleteConnectionRequest) => housesApi.completeConnection(data),
    onSuccess: (updatedHouse) => {
      queryClient.setQueryData(houseKeys.detail(updatedHouse.id), updatedHouse);
      queryClient.invalidateQueries({ queryKey: houseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.project(updatedHouse.project_id) });
      if (updatedHouse.assigned_team_id) {
        queryClient.invalidateQueries({ queryKey: houseKeys.team(updatedHouse.assigned_team_id) });
      }
      toast.success("Connection completed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to complete connection: ${error.message}`);
    },
  });
}

// Appointment Hooks
export function useAppointments(filters?: AppointmentFilters) {
  return useQuery({
    queryKey: appointmentKeys.list(filters || {}),
    queryFn: () => appointmentsApi.getAppointments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - appointments change more frequently
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentsApi.getAppointment(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useScheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleAppointmentRequest) => housesApi.scheduleAppointment(data),
    onSuccess: (newAppointment) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.detail(newAppointment.house_id) });
      queryClient.setQueryData(appointmentKeys.detail(newAppointment.id), newAppointment);
      toast.success("Appointment scheduled successfully");
    },
    onError: (error) => {
      toast.error(`Failed to schedule appointment: ${error.message}`);
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HouseAppointment> }) =>
      appointmentsApi.updateAppointment(id, data),
    onSuccess: (updatedAppointment) => {
      queryClient.setQueryData(appointmentKeys.detail(updatedAppointment.id), updatedAppointment);
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.detail(updatedAppointment.house_id) });
      toast.success("Appointment updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update appointment: ${error.message}`);
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentsApi.cancelAppointment(id, reason),
    onSuccess: (cancelledAppointment) => {
      queryClient.setQueryData(appointmentKeys.detail(cancelledAppointment.id), cancelledAppointment);
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.detail(cancelledAppointment.house_id) });
      toast.success("Appointment cancelled");
    },
    onError: (error) => {
      toast.error(`Failed to cancel appointment: ${error.message}`);
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newDate }: { id: string; newDate: string }) =>
      appointmentsApi.rescheduleAppointment(id, newDate),
    onSuccess: (rescheduledAppointment) => {
      queryClient.setQueryData(appointmentKeys.detail(rescheduledAppointment.id), rescheduledAppointment);
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.detail(rescheduledAppointment.house_id) });
      toast.success("Appointment rescheduled successfully");
    },
    onError: (error) => {
      toast.error(`Failed to reschedule appointment: ${error.message}`);
    },
  });
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.confirmAppointment(id),
    onSuccess: (confirmedAppointment) => {
      queryClient.setQueryData(appointmentKeys.detail(confirmedAppointment.id), confirmedAppointment);
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.detail(confirmedAppointment.house_id) });
      toast.success("Appointment confirmed");
    },
    onError: (error) => {
      toast.error(`Failed to confirm appointment: ${error.message}`);
    },
  });
}

export function useStartAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.startAppointment(id),
    onSuccess: (startedAppointment) => {
      queryClient.setQueryData(appointmentKeys.detail(startedAppointment.id), startedAppointment);
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.detail(startedAppointment.house_id) });
      toast.success("Appointment started");
    },
    onError: (error) => {
      toast.error(`Failed to start appointment: ${error.message}`);
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      appointmentsApi.completeAppointment(id, notes),
    onSuccess: (completedAppointment) => {
      queryClient.setQueryData(appointmentKeys.detail(completedAppointment.id), completedAppointment);
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: houseKeys.detail(completedAppointment.house_id) });
      toast.success("Appointment completed");
    },
    onError: (error) => {
      toast.error(`Failed to complete appointment: ${error.message}`);
    },
  });
}

// Specialized hooks for common use cases
export function usePendingConnections() {
  return useHouses({
    status: "not_assigned",
    page: 1,
    per_page: 50,
  });
}

export function useScheduledAppointments() {
  return useAppointments({
    status: "scheduled",
    page: 1,
    per_page: 20,
  });
}

export function useInProgressConnections() {
  return useHouses({
    status: "in_progress",
    page: 1,
    per_page: 20,
  });
}

export function useCompletedConnections() {
  return useHouses({
    status: "connected",
    page: 1,
    per_page: 20,
  });
}

export function useTodaysAppointments() {
  const today = new Date().toISOString().split('T')[0];
  return useAppointments({
    scheduled_date_from: today,
    scheduled_date_to: today,
    page: 1,
    per_page: 50,
  });
}

// Project Preparation specific hooks
export interface ProjectHouse {
  id: string;
  project_id: string;
  address: string;
  house_number?: string;
  apartment_count: number;
  floor_count?: number;
  connection_type: string;
  method: string;
  house_type?: string;
  status: string;
  planned_connection_date?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  coordinates_lat?: number;
  coordinates_lng?: number;
  notes?: string;
}

export interface HouseDocument {
  id: string;
  house_id: string;
  doc_type: string;
  filename: string;
  file_path: string;
  upload_date: string;
  uploaded_by?: string;
}

export interface ProjectHousesResponse {
  houses: ProjectHouse[];
  summary: {
    total_houses: number;
    connected_count: number;
    assigned_count: number;
    total_apartments: number;
  };
}

export interface CreateHouseData {
  project_id: string;
  address: string;
  house_number?: string;
  apartment_count: number;
  floor_count: number;
  connection_type: string;
  method: string;
  house_type: string;
  planned_connection_date?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  coordinates_lat?: number;
  coordinates_lng?: number;
  notes?: string;
}

export interface UpdateHouseData {
  house_id: string;
  address: string;
  house_number?: string;
  connection_type: string;
  method: string;
  status: string;
  planned_connection_date?: string;
  contact_name?: string;
  contact_phone?: string;
  notes?: string;
}

