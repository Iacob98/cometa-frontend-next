import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  documentsApi,
  documentCategoriesApi,
  documentAccessApi,
  documentSharesApi,
  documentTemplatesApi,
  type Document,
  type DocumentFilters,
  type CreateDocumentRequest,
  type UpdateDocumentRequest,
  type DocumentVersion,
  type DocumentAccess,
  type DocumentShare,
  type DocumentTemplate,
  type DocumentCategory,
  type DocumentSearchRequest,
  type DocumentSearchResult,
  type DocumentClassificationRequest,
  type PaginatedResponse,
} from "@/lib/api-client";

// Query keys
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  versions: (id: string) => [...documentKeys.all, "versions", id] as const,
  search: (query: string) => [...documentKeys.all, "search", query] as const,
  categories: () => [...documentKeys.all, "categories"] as const,
  category: (code: string) => [...documentKeys.categories(), code] as const,
  access: (documentId: string) => [...documentKeys.all, "access", documentId] as const,
  shares: (documentId: string) => [...documentKeys.all, "shares", documentId] as const,
  templates: () => [...documentKeys.all, "templates"] as const,
  template: (id: string) => [...documentKeys.templates(), id] as const,
};

// Document Hooks
export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: documentKeys.list(filters || {}),
    queryFn: () => documentsApi.getDocuments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.getDocument(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDocumentVersions(id: string) {
  return useQuery({
    queryKey: documentKeys.versions(id),
    queryFn: () => documentsApi.getDocumentVersions(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDocumentRequest) => documentsApi.uploadDocument(data),
    onSuccess: (newDocument) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.setQueryData(documentKeys.detail(newDocument.id), newDocument);

      // Invalidate related queries
      if (newDocument.project_id) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.list({ project_id: newDocument.project_id })
        });
      }
      if (newDocument.house_id) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.list({ house_id: newDocument.house_id })
        });
      }
      if (newDocument.work_entry_id) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.list({ work_entry_id: newDocument.work_entry_id })
        });
      }

      toast.success("Document uploaded successfully");
    },
    onError: (error) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentRequest }) =>
      documentsApi.updateDocument(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.detail(id) });
      const previousDocument = queryClient.getQueryData(documentKeys.detail(id));

      queryClient.setQueryData(documentKeys.detail(id), (old: Document | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousDocument };
    },
    onError: (error, { id }, context) => {
      if (context?.previousDocument) {
        queryClient.setQueryData(documentKeys.detail(id), context.previousDocument);
      }
      toast.error(`Failed to update document: ${error.message}`);
    },
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Document updated successfully");
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: documentKeys.detail(deletedId) });
      queryClient.removeQueries({ queryKey: documentKeys.versions(deletedId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const blob = await documentsApi.downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(`Failed to download document: ${error.message}`);
    },
  });
}

export function useCreateDocumentVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file, comment }: { id: string; file: File; comment?: string }) =>
      documentsApi.createNewVersion(id, file, comment),
    onSuccess: (newVersion, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      toast.success("New document version created");
    },
    onError: (error) => {
      toast.error(`Failed to create new version: ${error.message}`);
    },
  });
}

export function useRevertDocumentVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      documentsApi.revertToVersion(id, versionId),
    onSuccess: (revertedDocument) => {
      queryClient.setQueryData(documentKeys.detail(revertedDocument.id), revertedDocument);
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(revertedDocument.id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Document reverted to previous version");
    },
    onError: (error) => {
      toast.error(`Failed to revert document: ${error.message}`);
    },
  });
}

// Document Categories Hooks
export function useDocumentCategories() {
  return useQuery({
    queryKey: documentKeys.categories(),
    queryFn: () => documentCategoriesApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  });
}

export function useDocumentCategory(code: string) {
  return useQuery({
    queryKey: documentKeys.category(code),
    queryFn: () => documentCategoriesApi.getCategory(code),
    enabled: !!code,
    staleTime: 10 * 60 * 1000,
  });
}

// Document Search Hook
export function useSearchDocuments() {
  return useMutation({
    mutationFn: (searchRequest: DocumentSearchRequest) =>
      documentsApi.searchDocuments(searchRequest),
    onError: (error) => {
      toast.error(`Search failed: ${error.message}`);
    },
  });
}

// Document Classification Hook
export function useClassifyDocument() {
  return useMutation({
    mutationFn: (data: DocumentClassificationRequest) =>
      documentsApi.classifyDocument(data),
    onError: (error) => {
      toast.error(`Classification failed: ${error.message}`);
    },
  });
}

// OCR Hooks
export function useGetOCRResult(id: string) {
  return useQuery({
    queryKey: [...documentKeys.detail(id), "ocr"],
    queryFn: () => documentsApi.getOCRResult(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes - OCR results don't change
  });
}

export function useTriggerOCR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.triggerOCR(id),
    onSuccess: (result, id) => {
      // Invalidate OCR result to trigger refetch
      queryClient.invalidateQueries({
        queryKey: [...documentKeys.detail(id), "ocr"]
      });
      toast.success("OCR processing started", {
        description: `Job ID: ${result.job_id}`,
      });
    },
    onError: (error) => {
      toast.error(`Failed to start OCR: ${error.message}`);
    },
  });
}

// Document Access Hooks
export function useDocumentAccess(documentId: string) {
  return useQuery({
    queryKey: documentKeys.access(documentId),
    queryFn: () => documentAccessApi.getDocumentAccess(documentId),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGrantDocumentAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<DocumentAccess, 'id' | 'granted_at'>) =>
      documentAccessApi.grantAccess(data),
    onSuccess: (newAccess) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.access(newAccess.document_id)
      });
      toast.success("Access granted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to grant access: ${error.message}`);
    },
  });
}

export function useRevokeDocumentAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessId, documentId }: { accessId: string; documentId: string }) => {
      return documentAccessApi.revokeAccess(accessId).then(() => documentId);
    },
    onSuccess: (documentId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.access(documentId) });
      toast.success("Access revoked successfully");
    },
    onError: (error) => {
      toast.error(`Failed to revoke access: ${error.message}`);
    },
  });
}

// Document Shares Hooks
export function useDocumentShares(documentId: string) {
  return useQuery({
    queryKey: documentKeys.shares(documentId),
    queryFn: () => documentSharesApi.getDocumentShares(documentId),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDocumentShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<DocumentShare, 'id' | 'share_token' | 'access_count' | 'created_at' | 'last_accessed_at'>) =>
      documentSharesApi.createShare(data),
    onSuccess: (newShare) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.shares(newShare.document_id)
      });
      toast.success("Share link created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create share: ${error.message}`);
    },
  });
}

export function useDeleteDocumentShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, documentId }: { shareId: string; documentId: string }) => {
      return documentSharesApi.deleteShare(shareId).then(() => documentId);
    },
    onSuccess: (documentId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.shares(documentId) });
      toast.success("Share link deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete share: ${error.message}`);
    },
  });
}

// Document Templates Hooks
export function useDocumentTemplates() {
  return useQuery({
    queryKey: documentKeys.templates(),
    queryFn: () => documentTemplatesApi.getTemplates(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useDocumentTemplate(id: string) {
  return useQuery({
    queryKey: documentKeys.template(id),
    queryFn: () => documentTemplatesApi.getTemplate(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateDocumentFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: Record<string, any> }) =>
      documentTemplatesApi.createDocumentFromTemplate(templateId, data),
    onSuccess: (newDocument) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.setQueryData(documentKeys.detail(newDocument.id), newDocument);
      toast.success("Document created from template successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create document from template: ${error.message}`);
    },
  });
}

// Specialized hooks for common use cases
export function useProjectDocuments(projectId: string) {
  return useDocuments({
    project_id: projectId,
    page: 1,
    per_page: 50,
  });
}

export function useHouseDocuments(houseId: string) {
  return useDocuments({
    house_id: houseId,
    page: 1,
    per_page: 20,
  });
}

export function useWorkEntryDocuments(workEntryId: string) {
  return useDocuments({
    work_entry_id: workEntryId,
    page: 1,
    per_page: 20,
  });
}

export function useRecentDocuments() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return useDocuments({
    uploaded_after: thirtyDaysAgo.toISOString(),
    page: 1,
    per_page: 20,
  });
}

export function useDocumentsByCategory(category: string) {
  return useDocuments({
    category: category as any,
    page: 1,
    per_page: 50,
  });
}

// Helper hook for document actions
export function useDocumentActions() {
  const uploadDocument = useUploadDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();
  const createVersion = useCreateDocumentVersion();
  const revertVersion = useRevertDocumentVersion();

  return {
    upload: uploadDocument.mutate,
    update: updateDocument.mutate,
    delete: deleteDocument.mutate,
    download: downloadDocument.mutate,
    createVersion: createVersion.mutate,
    revertVersion: revertVersion.mutate,
    isLoading: uploadDocument.isPending ||
                updateDocument.isPending ||
                deleteDocument.isPending ||
                downloadDocument.isPending ||
                createVersion.isPending ||
                revertVersion.isPending,
  };
}