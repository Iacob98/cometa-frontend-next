"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image, FileIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useUploadDocument,
  useDocumentCategories,
  useClassifyDocument,
} from "@/hooks/use-documents";
import { cn } from "@/lib/utils";
import type {
  CreateDocumentRequest,
  DocumentCategoryCode,
  DocumentAccessLevel,
} from "@/types";

interface DocumentUploadProps {
  projectId?: string;
  houseId?: string;
  workEntryId?: string;
  teamId?: string;
  onUploadComplete?: (document: any) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
}

interface FileWithPreview extends File {
  preview?: string;
  category?: DocumentCategoryCode;
  tags?: string[];
  description?: string;
  accessLevel?: DocumentAccessLevel;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return Image;
  if (fileType.includes("pdf") || fileType.includes("document")) return FileText;
  return FileIcon;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function DocumentUpload({
  projectId,
  houseId,
  workEntryId,
  teamId,
  onUploadComplete,
  maxFiles = 10,
  acceptedFileTypes = ["image/*", "application/pdf", ".doc", ".docx", ".xls", ".xlsx"],
  maxFileSize = 50 * 1024 * 1024, // 50MB
}: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const uploadDocument = useUploadDocument();
  const { data: categories } = useDocumentCategories();
  const classifyDocument = useClassifyDocument();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newFiles: FileWithPreview[] = acceptedFiles.map((file) => {
        // Create preview for images
        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;

        return Object.assign(file, {
          preview,
          category: undefined,
          tags: [],
          description: "",
          accessLevel: "project" as DocumentAccessLevel,
        });
      });

      setFiles((prev) => [...prev, ...newFiles]);

      // Auto-classify documents
      for (const file of newFiles) {
        try {
          const result = await classifyDocument.mutateAsync({
            filename: file.name,
            mime_type: file.type,
            file_size: file.size,
          });

          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name && f.size === file.size
                ? {
                    ...f,
                    category: result.category,
                    tags: result.suggested_tags,
                  }
                : f
            )
          );
        } catch (error) {
          console.error("Classification failed for", file.name, error);
        }
      }
    },
    [files.length, maxFiles, classifyDocument]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateFileMetadata = (
    index: number,
    field: keyof FileWithPreview,
    value: any
  ) => {
    setFiles((prev) =>
      prev.map((file, i) =>
        i === index ? { ...file, [field]: value } : file
      )
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    for (const [index, file] of files.entries()) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const uploadData: CreateDocumentRequest = {
          file,
          category: file.category,
          tags: file.tags,
          project_id: projectId,
          house_id: houseId,
          work_entry_id: workEntryId,
          team_id: teamId,
          access_level: file.accessLevel,
          description: file.description,
        };

        // Simulate progress (in real implementation, this would come from upload progress)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: Math.min(prev[file.name] + 10, 90),
          }));
        }, 100);

        const document = await uploadDocument.mutateAsync(uploadData);

        clearInterval(progressInterval);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

        onUploadComplete?.(document);
      } catch (error) {
        console.error("Upload failed for", file.name, error);
        setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }));
      }
    }

    setUploading(false);
    setFiles([]);
    setUploadProgress({});
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Drag and drop files or click to select. Maximum {maxFiles} files,{" "}
          {formatFileSize(maxFileSize)} each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-primary">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-muted-foreground mb-2">
                Drag and drop files here, or click to select files
              </p>
              <p className="text-sm text-muted-foreground">
                Supported: {acceptedFileTypes.join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Files to Upload ({files.length})</h4>
            {files.map((file, index) => {
              const FileIconComponent = getFileIcon(file.type);
              const progress = uploadProgress[file.name] || 0;
              const isError = progress === -1;

              return (
                <Card key={`${file.name}-${file.size}`} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* File Icon/Preview */}
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded"
                          onLoad={() => URL.revokeObjectURL(file.preview!)}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <FileIconComponent className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* File Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium truncate max-w-xs">
                            {file.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Metadata Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`category-${index}`}>Category</Label>
                          <Select
                            value={file.category || ""}
                            onValueChange={(value) =>
                              updateFileMetadata(index, "category", value)
                            }
                            disabled={uploading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem key={category.code} value={category.code}>
                                  {category.name.en || category.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`access-${index}`}>Access Level</Label>
                          <Select
                            value={file.accessLevel || "project"}
                            onValueChange={(value) =>
                              updateFileMetadata(index, "accessLevel", value)
                            }
                            disabled={uploading}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="project">Project</SelectItem>
                              <SelectItem value="team">Team</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="admin">Admin Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <Textarea
                          id={`description-${index}`}
                          placeholder="Optional description..."
                          value={file.description || ""}
                          onChange={(e) =>
                            updateFileMetadata(index, "description", e.target.value)
                          }
                          disabled={uploading}
                          rows={2}
                        />
                      </div>

                      {/* Tags */}
                      {file.tags && file.tags.length > 0 && (
                        <div>
                          <Label>Suggested Tags</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {file.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload Progress */}
                      {uploading && progress >= 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}

                      {/* Error State */}
                      {isError && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>Upload failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Upload Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="min-w-32"
              >
                {uploading ? "Uploading..." : `Upload ${files.length} Files`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}