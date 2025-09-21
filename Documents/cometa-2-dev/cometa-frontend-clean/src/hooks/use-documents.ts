'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  WorkerDocument,
  DocumentCategory,
  DocumentsResponse,
  DocumentStatus,
  DocumentCategoryCode
} from '@/types';

export interface DocumentFilters {
  user_id?: string;
  category_code?: DocumentCategoryCode;
  status?: DocumentStatus;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface CreateDocumentRequest {
  user_id: string;
  category_id: string;
  document_number?: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  valid_until?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type: string;
  notes?: string;
}

export interface VerifyDocumentRequest {
  document_id: string;
  verified: boolean;
  notes?: string;
}

// Query keys
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  categories: () => [...documentKeys.all, 'categories'] as const,
  stats: () => [...documentKeys.all, 'stats'] as const,
};

// Fetch documents with filters
export function useDocuments(filters: DocumentFilters = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: async (): Promise<DocumentsResponse> => {
      const response = await fetch(`/api/documents?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    },
  });
}

// Upload new document
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentRequest) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all document queries to refresh data
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to upload document:', error);
      toast.error(error.message || 'Failed to upload document');
    },
  });
}

// Verify document
export function useVerifyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VerifyDocumentRequest) => {
      const response = await fetch(`/api/documents/${data.document_id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified: data.verified,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify document');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate document queries to refresh data
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      toast.success(variables.verified ? 'Document verified successfully' : 'Document verification removed');
    },
    onError: (error: Error) => {
      console.error('Failed to verify document:', error);
      toast.error(error.message || 'Failed to verify document');
    },
  });
}

// Delete document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate document queries to refresh data
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to delete document:', error);
      toast.error(error.message || 'Failed to delete document');
    },
  });
}

// Specialized hooks for common use cases
export function useUserDocuments(userId?: string) {
  return useDocuments({
    user_id: userId,
    page: 1,
    per_page: 50,
  });
}

export function useDocumentsByCategory(categoryCode?: DocumentCategoryCode) {
  return useDocuments({
    category_code: categoryCode,
    page: 1,
    per_page: 50,
  });
}

export function useExpiredDocuments() {
  return useDocuments({
    status: 'expired',
    page: 1,
    per_page: 50,
  });
}

export function useExpiringDocuments() {
  return useDocuments({
    status: 'expiring_soon',
    page: 1,
    per_page: 50,
  });
}

export function usePendingVerifications() {
  return useDocuments({
    status: 'pending',
    page: 1,
    per_page: 50,
  });
}

// Document categories and status constants
export const DOCUMENT_CATEGORIES: DocumentCategoryCode[] = [
  'WORK_PERMIT',
  'INSURANCE',
  'ID_DOCUMENT',
  'VISA',
  'MEDICAL',
  'SAFETY_TRAINING',
  'PASSPORT',
  'DRIVING_LICENSE',
];

export const DOCUMENT_STATUSES: DocumentStatus[] = [
  'active',
  'expired',
  'expiring_soon',
  'pending',
  'inactive',
];

// Helper function to get status label
export function getStatusLabel(status: DocumentStatus): string {
  const labels: Record<DocumentStatus, string> = {
    active: 'Active',
    expired: 'Expired',
    expiring_soon: 'Expiring Soon',
    pending: 'Pending Verification',
    inactive: 'Inactive',
  };

  return labels[status] || status;
}

// Helper function to get status color
export function getStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    expiring_soon: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Helper function to get category label
export function getCategoryLabel(categoryCode: DocumentCategoryCode): string {
  const labels: Record<DocumentCategoryCode, string> = {
    WORK_PERMIT: 'Work Permit',
    INSURANCE: 'Insurance',
    ID_DOCUMENT: 'ID Document',
    VISA: 'Visa',
    MEDICAL: 'Medical Certificate',
    SAFETY_TRAINING: 'Safety Training',
    PASSPORT: 'Passport',
    DRIVING_LICENSE: 'Driving License',
  };

  return labels[categoryCode] || categoryCode.replace(/_/g, ' ');
}

// Helper function to check if document is expiring soon
export function isExpiringSign(document: WorkerDocument): boolean {
  if (!document.expiry_date) return false;

  const expiry = new Date(document.expiry_date);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
}

// Helper function to check if document is expired
export function isExpired(document: WorkerDocument): boolean {
  if (!document.expiry_date) return false;

  const expiry = new Date(document.expiry_date);
  const now = new Date();

  return expiry < now;
}

// Helper function to get days until expiry
export function getDaysUntilExpiry(document: WorkerDocument): number | null {
  if (!document.expiry_date) return null;

  const expiry = new Date(document.expiry_date);
  const now = new Date();

  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get file type icon
export function getFileTypeIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📺';
  return '📎';
}

// Document categories hook - get all available categories
export function useDocumentCategories() {
  return useQuery({
    queryKey: documentKeys.categories(),
    queryFn: async (): Promise<DocumentCategory[]> => {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch document categories');
      }
      const data = await response.json();
      return data.categories || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Document search hook - search across document content
export function useSearchDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchRequest: {
      query: string;
      include_content?: boolean;
      highlight?: boolean;
      fuzzy?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      searchParams.append('search', searchRequest.query);
      if (searchRequest.include_content) searchParams.append('include_content', 'true');
      if (searchRequest.highlight) searchParams.append('highlight', 'true');
      if (searchRequest.fuzzy) searchParams.append('fuzzy', 'true');

      const response = await fetch(`/api/documents/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search documents');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Cache search results temporarily
      queryClient.setQueryData(['documents', 'search', data.query], data);
    },
    onError: (error: Error) => {
      toast.error(`Search failed: ${error.message}`);
    },
  });
}

// Document actions hook - for action menus and operations
export function useDocumentActions() {
  const queryClient = useQueryClient();

  const shareDocument = useMutation({
    mutationFn: async ({ documentId, accessLevel }: { documentId: string; accessLevel: 'public' | 'private' | 'team' }) => {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_level: accessLevel }),
      });
      if (!response.ok) throw new Error('Failed to share document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      toast.success('Document sharing updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const downloadDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) throw new Error('Failed to download document');
      const blob = await response.blob();
      return { blob, response };
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const duplicateDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}/duplicate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to duplicate document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      toast.success('Document duplicated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    shareDocument,
    downloadDocument,
    duplicateDocument,
  };
}

// Document classification hook - for auto-categorizing documents
export function useClassifyDocument() {
  return useMutation({
    mutationFn: async (file: File) => {
      // Simple classification based on file extension and name
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      // Classify based on file name patterns
      if (fileName.includes('passport') || fileName.includes('паспорт')) {
        return { category_code: 'PASSPORT', confidence: 0.9 };
      }
      if (fileName.includes('visa') || fileName.includes('виза')) {
        return { category_code: 'VISA', confidence: 0.85 };
      }
      if (fileName.includes('permit') || fileName.includes('разрешение')) {
        return { category_code: 'WORK_PERMIT', confidence: 0.8 };
      }
      if (fileName.includes('insurance') || fileName.includes('страхов')) {
        return { category_code: 'INSURANCE', confidence: 0.8 };
      }
      if (fileName.includes('medical') || fileName.includes('медицин')) {
        return { category_code: 'MEDICAL', confidence: 0.75 };
      }
      if (fileName.includes('safety') || fileName.includes('безопасн')) {
        return { category_code: 'SAFETY_TRAINING', confidence: 0.75 };
      }
      if (fileName.includes('license') || fileName.includes('лицензи')) {
        return { category_code: 'DRIVING_LICENSE', confidence: 0.7 };
      }

      // Default to ID document for images
      if (fileType.includes('image')) {
        return { category_code: 'ID_DOCUMENT', confidence: 0.5 };
      }

      // Default classification
      return { category_code: 'ID_DOCUMENT', confidence: 0.3 };
    },
    onError: (error: Error) => {
      console.warn('Document classification failed:', error);
    },
  });
}