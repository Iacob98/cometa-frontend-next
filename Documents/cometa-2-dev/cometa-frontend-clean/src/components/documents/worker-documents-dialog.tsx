"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  X
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { DocumentsResponse, WorkerDocument, DocumentStatus } from "@/types";

interface WorkerDocumentsDialogProps {
  userId: string;
  userName: string;
  trigger?: React.ReactNode;
}

async function fetchWorkerDocuments(userId: string): Promise<DocumentsResponse> {
  const response = await fetch(`/api/users/${userId}/documents`);
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  return response.json();
}

function getStatusColor(status: DocumentStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'expired':
      return 'bg-red-500';
    case 'expiring_soon':
      return 'bg-yellow-500';
    case 'pending':
      return 'bg-blue-500';
    case 'inactive':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

function getStatusIcon(status: DocumentStatus) {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4" />;
    case 'expired':
      return <AlertTriangle className="h-4 w-4" />;
    case 'expiring_soon':
      return <Clock className="h-4 w-4" />;
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'inactive':
      return <X className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getStatusText(status: DocumentStatus): string {
  switch (status) {
    case 'active':
      return 'Действителен';
    case 'expired':
      return 'Истёк';
    case 'expiring_soon':
      return 'Истекает скоро';
    case 'pending':
      return 'В ожидании';
    case 'inactive':
      return 'Неактивен';
    default:
      return 'Неизвестен';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function DocumentCard({ document }: { document: WorkerDocument }) {
  const statusColor = getStatusColor(document.status);
  const statusIcon = getStatusIcon(document.status);
  const statusText = getStatusText(document.status);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: document.category.color }}
            />
            {document.category.name_ru || document.category.name_en}
          </CardTitle>
          <Badge
            variant="secondary"
            className={`${statusColor} text-white flex items-center gap-1`}
          >
            {statusIcon}
            {statusText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {document.document_number && (
            <div>
              <span className="font-medium text-muted-foreground">Номер документа:</span>
              <p>{document.document_number}</p>
            </div>
          )}

          {document.issuing_authority && (
            <div>
              <span className="font-medium text-muted-foreground">Выдавший орган:</span>
              <p>{document.issuing_authority}</p>
            </div>
          )}

          {document.issue_date && (
            <div>
              <span className="font-medium text-muted-foreground">Дата выдачи:</span>
              <p>{new Date(document.issue_date).toLocaleDateString('ru-RU')}</p>
            </div>
          )}

          {document.expiry_date && (
            <div>
              <span className="font-medium text-muted-foreground">Дата истечения:</span>
              <p className={document.status === 'expired' ? 'text-red-600 font-medium' : document.status === 'expiring_soon' ? 'text-yellow-600 font-medium' : ''}>
                {new Date(document.expiry_date).toLocaleDateString('ru-RU')}
              </p>
            </div>
          )}
        </div>

        {document.notes && (
          <div>
            <span className="font-medium text-muted-foreground">Примечания:</span>
            <p className="text-sm mt-1">{document.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{document.file_name}</span>
            <span>({formatFileSize(document.file_size)})</span>
            {document.is_verified && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Shield className="h-3 w-3 mr-1" />
                Проверен
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Просмотр
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Скачать
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentsByCategory({ documents }: { documents: WorkerDocument[] }) {
  // Group documents by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    const categoryName = doc.category.name_ru || doc.category.name_en;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(doc);
    return acc;
  }, {} as Record<string, WorkerDocument[]>);

  return (
    <div className="space-y-6">
      {Object.entries(documentsByCategory).map(([categoryName, categoryDocs]) => (
        <div key={categoryName}>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryDocs[0].category.color }}
            />
            {categoryName}
            <Badge variant="outline">{categoryDocs.length}</Badge>
          </h3>
          {categoryDocs.map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function WorkerDocumentsDialog({
  userId,
  userName,
  trigger
}: WorkerDocumentsDialogProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['worker-documents', userId],
    queryFn: () => fetchWorkerDocuments(userId),
    enabled: open, // Only fetch when dialog is open
  });

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <FileText className="h-4 w-4 mr-1" />
      Документы
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Документы работника: {userName}
          </DialogTitle>
          <DialogDescription>
            Просмотр всех документов работника (страховка, разрешения, удостоверения)
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-destructive">Ошибка загрузки документов</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{data.stats.total}</div>
                  <div className="text-sm text-muted-foreground">Всего</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{data.stats.active}</div>
                  <div className="text-sm text-muted-foreground">Действительных</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{data.stats.expiring_soon}</div>
                  <div className="text-sm text-muted-foreground">Истекают скоро</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{data.stats.expired}</div>
                  <div className="text-sm text-muted-foreground">Истёкших</div>
                </CardContent>
              </Card>
            </div>

            {/* Documents */}
            {data.documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Нет документов</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  У этого работника пока нет загруженных документов.
                </p>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Все ({data.stats.total})</TabsTrigger>
                  <TabsTrigger value="active">Действительные ({data.stats.active})</TabsTrigger>
                  <TabsTrigger value="expiring">Истекают ({data.stats.expiring_soon})</TabsTrigger>
                  <TabsTrigger value="expired">Истёкшие ({data.stats.expired})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <DocumentsByCategory documents={data.documents} />
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                  <DocumentsByCategory
                    documents={data.documents.filter(doc => doc.status === 'active')}
                  />
                </TabsContent>

                <TabsContent value="expiring" className="mt-6">
                  <DocumentsByCategory
                    documents={data.documents.filter(doc => doc.status === 'expiring_soon')}
                  />
                </TabsContent>

                <TabsContent value="expired" className="mt-6">
                  <DocumentsByCategory
                    documents={data.documents.filter(doc => doc.status === 'expired')}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}