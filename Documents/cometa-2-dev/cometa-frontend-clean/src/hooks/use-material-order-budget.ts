import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  MaterialOrderBudgetImpact,
  CreateBudgetTransactionRequest,
  BudgetTransactionResponse
} from '@/types';

// Get budget impact for a material order
export function useMaterialOrderBudgetImpact(orderId: string) {
  return useQuery({
    queryKey: ['material-order-budget', orderId],
    queryFn: async (): Promise<MaterialOrderBudgetImpact> => {
      const response = await fetch(`/api/materials/orders/${orderId}/budget`);
      if (!response.ok) {
        throw new Error('Failed to fetch budget impact');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

// Create budget transaction for material order
export function useCreateBudgetTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      data
    }: {
      orderId: string;
      data: CreateBudgetTransactionRequest
    }): Promise<BudgetTransactionResponse> => {
      const response = await fetch(`/api/materials/orders/${orderId}/budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create budget transaction');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['material-order-budget', variables.orderId]
      });
      queryClient.invalidateQueries({
        queryKey: ['material-orders']
      });
      queryClient.invalidateQueries({
        queryKey: ['financial-summary']
      });
      queryClient.invalidateQueries({
        queryKey: ['project', data.project_id]
      });

      toast.success(`Budget transaction created: €${data.amount_deducted.toFixed(2)} deducted`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create budget transaction');
    },
  });
}

// Hook to automatically deduct budget on order creation
export function useAutoBudgetDeduction() {
  const createBudgetTransaction = useCreateBudgetTransaction();

  const deductFromBudget = async (orderId: string, deduct: boolean = true) => {
    if (!deduct) return null;

    try {
      return await createBudgetTransaction.mutateAsync({
        orderId,
        data: { deduct_from_budget: true }
      });
    } catch (error) {
      console.error('Auto budget deduction failed:', error);
      return null;
    }
  };

  return {
    deductFromBudget,
    isLoading: createBudgetTransaction.isPending,
    error: createBudgetTransaction.error,
  };
}