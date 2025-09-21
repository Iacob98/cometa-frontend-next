import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  materialsApi,
  suppliersApi,
  materialAllocationsApi,
  materialOrdersApi,
  type Material,
  type Supplier,
  type MaterialAllocation,
  type MaterialOrder,
  type MaterialFilters,
  type AllocationFilters,
  type OrderFilters,
  type AllocationRequest,
  type MaterialOrderStatus,
  type PaginatedResponse,
} from "@/lib/api-client";

// Query keys
export const materialKeys = {
  all: ["materials"] as const,
  lists: () => [...materialKeys.all, "list"] as const,
  list: (filters: MaterialFilters) => [...materialKeys.lists(), filters] as const,
  details: () => [...materialKeys.all, "detail"] as const,
  detail: (id: string) => [...materialKeys.details(), id] as const,
  lowStock: () => [...materialKeys.all, "low-stock"] as const,
};

export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  details: () => [...supplierKeys.all, "detail"] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
};

export const allocationKeys = {
  all: ["allocations"] as const,
  lists: () => [...allocationKeys.all, "list"] as const,
  list: (filters: AllocationFilters) => [...allocationKeys.lists(), filters] as const,
  details: () => [...allocationKeys.all, "detail"] as const,
  detail: (id: string) => [...allocationKeys.details(), id] as const,
};

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// Material Hooks
export function useMaterials(filters?: MaterialFilters) {
  return useQuery({
    queryKey: materialKeys.list(filters || {}),
    queryFn: () => materialsApi.getMaterials(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: materialKeys.detail(id),
    queryFn: () => materialsApi.getMaterial(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLowStockMaterials() {
  return useQuery({
    queryKey: materialKeys.lowStock(),
    queryFn: () => materialsApi.getLowStockMaterials(),
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent updates for stock alerts
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Material>) => materialsApi.createMaterial(data),
    onSuccess: (newMaterial) => {
      queryClient.invalidateQueries({ queryKey: materialKeys.lists() });
      queryClient.setQueryData(materialKeys.detail(newMaterial.id), newMaterial);
      toast.success("Material created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create material: ${error.message}`);
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Material> }) =>
      materialsApi.updateMaterial(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: materialKeys.detail(id) });
      const previousMaterial = queryClient.getQueryData(materialKeys.detail(id));

      queryClient.setQueryData(materialKeys.detail(id), (old: Material | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousMaterial };
    },
    onError: (error, { id }, context) => {
      if (context?.previousMaterial) {
        queryClient.setQueryData(materialKeys.detail(id), context.previousMaterial);
      }
      toast.error(`Failed to update material: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.lists() });
      queryClient.invalidateQueries({ queryKey: materialKeys.lowStock() });
      toast.success("Material updated successfully");
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: materialKeys.detail(id) });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => materialsApi.deleteMaterial(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: materialKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: materialKeys.lists() });
      queryClient.invalidateQueries({ queryKey: materialKeys.lowStock() });
      toast.success("Material deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete material: ${error.message}`);
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, adjustment }: { id: string; adjustment: { quantity: number; reason: string } }) =>
      materialsApi.adjustStock(id, adjustment),
    onSuccess: (updatedMaterial) => {
      queryClient.setQueryData(materialKeys.detail(updatedMaterial.id), updatedMaterial);
      queryClient.invalidateQueries({ queryKey: materialKeys.lists() });
      queryClient.invalidateQueries({ queryKey: materialKeys.lowStock() });
      toast.success("Stock adjusted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to adjust stock: ${error.message}`);
    },
  });
}

// Supplier Hooks
export function useSuppliers() {
  return useQuery({
    queryKey: supplierKeys.lists(),
    queryFn: () => suppliersApi.getSuppliers(),
    staleTime: 10 * 60 * 1000, // 10 minutes - suppliers change less frequently
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => suppliersApi.getSupplier(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Supplier>) => suppliersApi.createSupplier(data),
    onSuccess: (newSupplier) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.setQueryData(supplierKeys.detail(newSupplier.id), newSupplier);
      toast.success("Supplier created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create supplier: ${error.message}`);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      suppliersApi.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast.success("Supplier updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update supplier: ${error.message}`);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suppliersApi.deleteSupplier(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: supplierKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast.success("Supplier deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });
}

// Allocation Hooks
export function useAllocations(filters?: AllocationFilters) {
  return useQuery({
    queryKey: allocationKeys.list(filters || {}),
    queryFn: () => materialAllocationsApi.getAllocations(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - allocations change frequently
  });
}

export function useAllocation(id: string) {
  return useQuery({
    queryKey: allocationKeys.detail(id),
    queryFn: () => materialAllocationsApi.getAllocation(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AllocationRequest) => materialAllocationsApi.createAllocation(data),
    onSuccess: (newAllocation) => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: materialKeys.lists() });
      queryClient.invalidateQueries({ queryKey: materialKeys.lowStock() });
      queryClient.setQueryData(allocationKeys.detail(newAllocation.id), newAllocation);
      toast.success("Material allocated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to allocate material: ${error.message}`);
    },
  });
}

export function useRecordUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, usage }: { id: string; usage: { used_qty: number; notes?: string } }) =>
      materialAllocationsApi.recordUsage(id, usage),
    onSuccess: (updatedAllocation) => {
      queryClient.setQueryData(allocationKeys.detail(updatedAllocation.id), updatedAllocation);
      queryClient.invalidateQueries({ queryKey: allocationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: materialKeys.lists() });
      toast.success("Usage recorded successfully");
    },
    onError: (error) => {
      toast.error(`Failed to record usage: ${error.message}`);
    },
  });
}

// Order Hooks
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: orderKeys.list(filters || {}),
    queryFn: () => materialOrdersApi.getOrders(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => materialOrdersApi.getOrder(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<MaterialOrder>) => materialOrdersApi.createOrder(data),
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.setQueryData(orderKeys.detail(newOrder.id), newOrder);
      toast.success("Order created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create order: ${error.message}`);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaterialOrderStatus }) =>
      materialOrdersApi.updateOrderStatus(id, status),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

      // If order is delivered, update material stock levels
      if (updatedOrder.status === "delivered") {
        queryClient.invalidateQueries({ queryKey: materialKeys.lists() });
        queryClient.invalidateQueries({ queryKey: materialKeys.lowStock() });
      }

      toast.success("Order status updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update order status: ${error.message}`);
    },
  });
}

// Specialized hooks
export function useProjectAllocations(projectId: string) {
  return useAllocations({ project_id: projectId });
}

export function useTeamAllocations(teamId: string) {
  return useAllocations({ team_id: teamId });
}

export function usePendingOrders() {
  return useOrders({ status: "pending" });
}

export function useSupplierOrders(supplierId: string) {
  return useOrders({ supplier_id: supplierId });
}

// Project Preparation specific hooks
export interface ProjectMaterial {
  id: string;
  material_id: string;
  name: string;
  sku?: string;
  unit: string;
  description?: string;
  allocated_qty: number;
  unit_price: number;
  total_cost: number;
  allocation_date: string;
  return_date?: string;
  status: 'allocated' | 'used' | 'returned' | 'cancelled';
  notes?: string;
  allocated_by_name?: string;
}

export interface WarehouseMaterial {
  id: string;
  name: string;
  sku?: string;
  unit: string;
  description?: string;
  available_qty: number;
  total_qty: number;
  reserved_qty: number;
  min_stock: number;
  price: number;
}

export interface ProjectMaterialsResponse {
  materials: ProjectMaterial[];
  summary: {
    total_materials: number;
    pending_count: number;
    used_count: number;
    total_cost: number;
  };
}

export interface MaterialAssignmentData {
  project_id: string;
  material_id: string;
  quantity: number;
  from_date: string;
  to_date?: string;
  notes?: string;
}

export interface UpdateMaterialAssignmentData {
  assignment_id: string;
  quantity: number;
  unit_price: number;
  from_date: string;
  to_date?: string;
  notes?: string;
}

export function useProjectMaterials(projectId: string) {
  return useQuery({
    queryKey: [...materialKeys.all, "project", projectId],
    queryFn: async (): Promise<ProjectMaterialsResponse> => {
      const response = await fetch(`/api/materials/project/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project materials');
      }
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWarehouseMaterials() {
  return useQuery({
    queryKey: [...materialKeys.all, "warehouse"],
    queryFn: async (): Promise<WarehouseMaterial[]> => {
      const response = await fetch('/api/materials/warehouse');
      if (!response.ok) {
        throw new Error('Failed to fetch warehouse materials');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAssignMaterialToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MaterialAssignmentData) => {
      const response = await fetch('/api/materials/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign material');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch project materials
      queryClient.invalidateQueries({
        queryKey: [...materialKeys.all, "project", variables.project_id]
      });

      // Invalidate warehouse materials (stock has changed)
      queryClient.invalidateQueries({
        queryKey: [...materialKeys.all, "warehouse"]
      });

      toast.success('Material assigned successfully');
    },
    onError: (error) => {
      toast.error(`Failed to assign material: ${error.message}`);
    },
  });
}

export function useUpdateMaterialAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMaterialAssignmentData) => {
      const { assignment_id, ...updateData } = data;
      const response = await fetch(`/api/materials/assignments/${assignment_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update material assignment');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === "materials" &&
                 query.queryKey[1] === "project";
        }
      });

      toast.success('Material assignment updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update material assignment: ${error.message}`);
    },
  });
}

export function useDeleteMaterialAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await fetch(`/api/materials/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete material assignment');
      }

      return response.json();
    },
    onSuccess: (data, assignmentId) => {
      // Invalidate all project materials queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === "materials" &&
                 query.queryKey[1] === "project";
        }
      });

      // Invalidate warehouse materials (stock might have changed)
      queryClient.invalidateQueries({
        queryKey: [...materialKeys.all, "warehouse"]
      });

      toast.success('Material assignment deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete material assignment: ${error.message}`);
    },
  });
}