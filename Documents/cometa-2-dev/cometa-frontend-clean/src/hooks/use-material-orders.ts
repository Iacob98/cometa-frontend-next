import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ProjectMaterialOrder,
  CreateMaterialOrderRequest,
  MaterialOrderStatus
} from "@/types";
import { useAutoBudgetDeduction } from "./use-material-order-budget";

// Query keys
export const materialOrderKeys = {
  all: ["material-orders"] as const,
  lists: () => [...materialOrderKeys.all, "list"] as const,
  list: (filters: any) => [...materialOrderKeys.lists(), filters] as const,
  details: () => [...materialOrderKeys.all, "detail"] as const,
  detail: (id: string) => [...materialOrderKeys.details(), id] as const,
};

export interface MaterialOrderFilters {
  project_id?: string;
  supplier_id?: string;
  status?: MaterialOrderStatus;
  page?: number;
  per_page?: number;
}

// Fetch material orders
async function fetchMaterialOrders(filters?: MaterialOrderFilters): Promise<{
  items: ProjectMaterialOrder[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}> {
  const params = new URLSearchParams();

  if (filters?.project_id) params.set('project_id', filters.project_id);
  if (filters?.supplier_id) params.set('supplier_id', filters.supplier_id);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.per_page) params.set('per_page', filters.per_page.toString());

  const response = await fetch(`/api/materials/orders?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch material orders");
  }
  return response.json();
}

// Fetch single material order
async function fetchMaterialOrder(id: string): Promise<ProjectMaterialOrder> {
  const response = await fetch(`/api/materials/orders/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch material order");
  }
  return response.json();
}

// Create material order
async function createMaterialOrder(data: CreateMaterialOrderRequest): Promise<ProjectMaterialOrder> {
  const response = await fetch("/api/materials/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create material order");
  }

  return response.json();
}

// Update material order
async function updateMaterialOrder(id: string, data: {
  status?: MaterialOrderStatus;
  actual_delivery_date?: string;
  notes?: string;
}): Promise<ProjectMaterialOrder> {
  const response = await fetch(`/api/materials/orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update material order");
  }

  return response.json();
}

// Delete material order
async function deleteMaterialOrder(id: string): Promise<void> {
  const response = await fetch(`/api/materials/orders/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete material order");
  }
}

// Hooks
export function useMaterialOrders(filters?: MaterialOrderFilters) {
  return useQuery({
    queryKey: materialOrderKeys.list(filters || {}),
    queryFn: () => fetchMaterialOrders(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMaterialOrder(id: string) {
  return useQuery({
    queryKey: materialOrderKeys.detail(id),
    queryFn: () => fetchMaterialOrder(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateMaterialOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMaterialOrder,
    onSuccess: (newOrder) => {
      // Invalidate orders lists
      queryClient.invalidateQueries({ queryKey: materialOrderKeys.lists() });

      // Add the new order to cache
      queryClient.setQueryData(materialOrderKeys.detail(newOrder.id), newOrder);

      toast.success("Material order created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create order: ${error.message}`);
    },
  });
}

// Enhanced hook with automatic budget deduction
export function useCreateMaterialOrderWithBudget() {
  const createOrder = useCreateMaterialOrder();
  const { deductFromBudget } = useAutoBudgetDeduction();

  return useMutation({
    mutationFn: async (data: CreateMaterialOrderRequest & { deduct_from_budget?: boolean }) => {
      const { deduct_from_budget = true, ...orderData } = data;

      // Create the order first
      const newOrder = await createOrder.mutateAsync(orderData);

      // Then deduct from budget if requested
      if (deduct_from_budget && newOrder.project_id) {
        try {
          await deductFromBudget(newOrder.id, true);
        } catch (budgetError) {
          console.warn('Budget deduction failed, but order was created:', budgetError);
          toast.warning('Order created but budget deduction failed. Please manage manually.');
        }
      }

      return newOrder;
    },
    onSuccess: (newOrder) => {
      toast.success(`Order created and €${newOrder.total_cost_eur.toFixed(2)} deducted from project budget`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create order: ${error.message}`);
    },
  });
}

export function useUpdateMaterialOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateMaterialOrder(id, data),
    onSuccess: (updatedOrder) => {
      // Update individual order cache
      queryClient.setQueryData(
        materialOrderKeys.detail(updatedOrder.id),
        updatedOrder
      );

      // Invalidate orders lists
      queryClient.invalidateQueries({ queryKey: materialOrderKeys.lists() });

      toast.success("Order updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update order: ${error.message}`);
    },
  });
}

export function useDeleteMaterialOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMaterialOrder,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: materialOrderKeys.detail(deletedId),
      });

      // Invalidate orders lists
      queryClient.invalidateQueries({ queryKey: materialOrderKeys.lists() });

      toast.success("Order deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete order: ${error.message}`);
    },
  });
}

// Project-specific hooks
export function useProjectMaterialOrders(projectId: string) {
  return useMaterialOrders({ project_id: projectId });
}

export function useSupplierMaterialOrders(supplierId: string) {
  return useMaterialOrders({ supplier_id: supplierId });
}