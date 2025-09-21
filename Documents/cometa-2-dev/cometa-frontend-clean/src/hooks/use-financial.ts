'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Transaction,
  CreateTransactionRequest,
  FinancialFilters,
  FinancialSummary
} from '@/types';

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Query keys
export const financialKeys = {
  all: ['financial'] as const,
  transactions: () => [...financialKeys.all, 'transactions'] as const,
  transactionsList: (filters: FinancialFilters) => [...financialKeys.transactions(), filters] as const,
  summary: (filters: Omit<FinancialFilters, 'page' | 'per_page'>) =>
    [...financialKeys.all, 'summary', filters] as const,
};

// Fetch transactions with filters
export function useTransactions(filters: FinancialFilters = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return useQuery({
    queryKey: financialKeys.transactionsList(filters),
    queryFn: async (): Promise<TransactionsResponse> => {
      const response = await fetch(`/api/transactions?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
  });
}

// Fetch financial summary
export function useFinancialSummary(filters: Omit<FinancialFilters, 'page' | 'per_page'> = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return useQuery({
    queryKey: financialKeys.summary(filters),
    queryFn: async (): Promise<FinancialSummary> => {
      const response = await fetch(`/api/financial/summary?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch financial summary');
      }
      return response.json();
    },
  });
}

// Create new transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionRequest) => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all financial queries to refresh data
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
      toast.success('Transaction created successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to create transaction:', error);
      toast.error(error.message || 'Failed to create transaction');
    },
  });
}

// Specialized hooks for common use cases
export function useProjectTransactions(projectId?: string) {
  return useTransactions({
    project_id: projectId,
    page: 1,
    per_page: 20,
  });
}

export function useRecentTransactions(limit = 10) {
  return useTransactions({
    page: 1,
    per_page: limit,
  });
}

export function useExpensesByCategory(category?: string) {
  return useTransactions({
    type: 'expense',
    category: category as any,
    page: 1,
    per_page: 50,
  });
}

export function useIncomeTransactions() {
  return useTransactions({
    type: 'income',
    page: 1,
    per_page: 50,
  });
}

export function usePendingTransactions() {
  return useTransactions({
    approved: false,
    page: 1,
    per_page: 50,
  });
}

// Transaction categories for filtering and forms
export const TRANSACTION_CATEGORIES = [
  'material_cost',
  'equipment_rental',
  'labor_cost',
  'vehicle_expense',
  'fuel',
  'maintenance',
  'insurance',
  'permit_fee',
  'subcontractor',
  'overtime',
  'bonus',
  'fine',
  'utility',
  'office_expense',
  'travel',
  'accommodation',
  'meal',
  'communication',
  'software_license',
  'training',
  'safety_equipment',
  'other',
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number];

// Payment methods
export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'credit_card',
  'check',
  'invoice',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Helper function to get category label
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    material_cost: 'Material Cost',
    equipment_rental: 'Equipment Rental',
    labor_cost: 'Labor Cost',
    vehicle_expense: 'Vehicle Expense',
    fuel: 'Fuel',
    maintenance: 'Maintenance',
    insurance: 'Insurance',
    permit_fee: 'Permit Fee',
    subcontractor: 'Subcontractor',
    overtime: 'Overtime',
    bonus: 'Bonus',
    fine: 'Fine',
    utility: 'Utility',
    office_expense: 'Office Expense',
    travel: 'Travel',
    accommodation: 'Accommodation',
    meal: 'Meal',
    communication: 'Communication',
    software_license: 'Software License',
    training: 'Training',
    safety_equipment: 'Safety Equipment',
    other: 'Other',
  };

  return labels[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to get category color
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    material_cost: 'bg-blue-100 text-blue-800',
    equipment_rental: 'bg-purple-100 text-purple-800',
    labor_cost: 'bg-green-100 text-green-800',
    vehicle_expense: 'bg-orange-100 text-orange-800',
    fuel: 'bg-red-100 text-red-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    insurance: 'bg-indigo-100 text-indigo-800',
    permit_fee: 'bg-pink-100 text-pink-800',
    subcontractor: 'bg-teal-100 text-teal-800',
    overtime: 'bg-emerald-100 text-emerald-800',
    bonus: 'bg-cyan-100 text-cyan-800',
    fine: 'bg-rose-100 text-rose-800',
    utility: 'bg-slate-100 text-slate-800',
    office_expense: 'bg-zinc-100 text-zinc-800',
    travel: 'bg-violet-100 text-violet-800',
    accommodation: 'bg-fuchsia-100 text-fuchsia-800',
    meal: 'bg-lime-100 text-lime-800',
    communication: 'bg-sky-100 text-sky-800',
    software_license: 'bg-amber-100 text-amber-800',
    training: 'bg-stone-100 text-stone-800',
    safety_equipment: 'bg-neutral-100 text-neutral-800',
    other: 'bg-gray-100 text-gray-800',
  };

  return colors[category] || 'bg-gray-100 text-gray-800';
}

// Helper function to get payment method label
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
    check: 'Check',
    invoice: 'Invoice',
  };

  return labels[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to format currency
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper function to get transaction type color
export function getTransactionTypeColor(type: string): string {
  switch (type) {
    case 'income':
      return 'text-green-600';
    case 'expense':
      return 'text-red-600';
    case 'transfer':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}