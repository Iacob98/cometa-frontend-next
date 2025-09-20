"use client";

import React, { useState } from "react";
import {
  FileText,
  Image,
  Download,
  Eye,
  Edit,
  Trash2,
  Share,
  Clock,
  User,
  Lock,
  Tag,
  MoreHorizontal,
  History,
  FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDocumentActions } from "@/hooks/use-documents";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Document, DocumentAccessLevel } from "@/types";

interface DocumentItemProps {
  document: Document;
  onEdit?: (document: Document) => void;
  onShare?: (document: Document) => void;
  onViewVersions?: (document: Document) => void;
  showActions?: boolean;
  compact?: boolean;
}

const getDocumentIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return FileIcon;
};

const getAccessLevelColor = (level: DocumentAccessLevel): string => {
  const colors = {
    public: "bg-green-100 text-green-800",
    project: "bg-blue-100 text-blue-800",
    team: "bg-yellow-100 text-yellow-800",
    private: "bg-purple-100 text-purple-800",
    admin: "bg-red-100 text-red-800",
  };
  return colors[level] || colors.project;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function DocumentItem({
  document,
  onEdit,
  onShare,
  onViewVersions,
  showActions = true,
  compact = false,
}: DocumentItemProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const { download } = useDocumentActions();

  const DocumentIcon = getDocumentIcon(document.mime_type);

  const handleDownload = () => {
    download({
      id: document.id,
      filename: document.original_filename,
    });
  };

  const handlePreview = () => {
    if (document.mime_type.startsWith("image/") || document.mime_type.includes("pdf")) {
      setPreviewOpen(true);
    } else {
      handleDownload();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex-shrink-0">
          <DocumentIcon className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{document.original_filename}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(document.size)} • {formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}
          </p>
        </div>
        {showActions && (
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <DocumentIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base truncate" title={document.original_filename}>
                  {document.original_filename}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>{formatFileSize(document.size)}</span>
                  {document.version > 1 && (
                    <Badge variant="outline" className="text-xs">
                      v{document.version}
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePreview}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(document)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem onClick={() => onShare(document)}>
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  )}
                  {onViewVersions && (
                    <DropdownMenuItem onClick={() => onViewVersions(document)}>
                      <History className="w-4 h-4 mr-2" />
                      Versions
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Category and Access Level */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {document.category?.name?.en || document.category?.code || "Uncategorized"}
            </Badge>
            <Badge className={cn("text-xs", getAccessLevelColor(document.access_level))}>
              <Lock className="w-3 h-3 mr-1" />
              {document.access_level}
            </Badge>
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* OCR Status */}
          {document.ocr_data && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Text extracted ({document.ocr_data.confidence}% confidence)</span>
            </div>
          )}

          {/* Upload Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>
                {document.uploader?.first_name} {document.uploader?.last_name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Context Information */}
          {(document.project || document.house || document.work_entry) && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Linked to:</p>
              <div className="space-y-1">
                {document.project && (
                  <Badge variant="outline" className="text-xs">
                    Project: {document.project.name}
                  </Badge>
                )}
                {document.house && (
                  <Badge variant="outline" className="text-xs">
                    House: {document.house.house_number}
                  </Badge>
                )}
                {document.work_entry && (
                  <Badge variant="outline" className="text-xs">
                    Work Entry: {document.work_entry.stage_code}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{document.original_filename}</DialogTitle>
            <DialogDescription>
              {formatFileSize(document.size)} • {document.mime_type}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {document.mime_type.startsWith("image/") ? (
              <img
                src={document.url}
                alt={document.original_filename}
                className="max-w-full h-auto mx-auto"
              />
            ) : document.mime_type.includes("pdf") ? (
              <iframe
                src={document.url}
                className="w-full h-96"
                title={document.original_filename}
              />
            ) : (
              <div className="text-center py-8">
                <FileIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Preview not available for this file type
                </p>
                <Button onClick={handleDownload} className="mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}