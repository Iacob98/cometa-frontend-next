"use client";

import React, { useState } from "react";
import { Search, Filter, Grid, List, Upload, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DocumentItem } from "./document-item";
import { DocumentUpload } from "./document-upload";
import { useDocuments, useDocumentCategories } from "@/hooks/use-documents";
import type { DocumentFilters, DocumentCategoryCode, DocumentAccessLevel } from "@/types";

interface DocumentListProps {
  projectId?: string;
  houseId?: string;
  workEntryId?: string;
  teamId?: string;
  showUpload?: boolean;
  title?: string;
  description?: string;
}

export function DocumentList({
  projectId,
  houseId,
  workEntryId,
  teamId,
  showUpload = true,
  title = "Documents",
  description,
}: DocumentListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategoryCode | "all">("all");
  const [accessLevelFilter, setAccessLevelFilter] = useState<DocumentAccessLevel | "all">("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Build filters
  const filters: DocumentFilters = {
    project_id: projectId,
    house_id: houseId,
    work_entry_id: workEntryId,
    team_id: teamId,
    search: searchQuery || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    access_level: accessLevelFilter !== "all" ? accessLevelFilter : undefined,
    page: 1,
    per_page: 50,
  };

  const { data: documentsResponse, isLoading, error } = useDocuments(filters);
  const { data: categories } = useDocumentCategories();

  const documents = documentsResponse?.items || [];
  const totalDocuments = documentsResponse?.total || 0;

  const handleUploadComplete = () => {
    setUploadDialogOpen(false);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive">Failed to load documents</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {showUpload && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Documents</DialogTitle>
                <DialogDescription>
                  Upload and organize your project documents
                </DialogDescription>
              </DialogHeader>
              <DocumentUpload
                projectId={projectId}
                houseId={houseId}
                workEntryId={workEntryId}
                teamId={teamId}
                onUploadComplete={handleUploadComplete}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as DocumentCategoryCode | "all")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.code} value={category.code}>
                    {category.name.en || category.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Access Level Filter */}
            <Select
              value={accessLevelFilter}
              onValueChange={(value) => setAccessLevelFilter(value as DocumentAccessLevel | "all")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{totalDocuments} documents</span>
        {searchQuery && <span>• Searching for "{searchQuery}"</span>}
        {categoryFilter !== "all" && (
          <Badge variant="secondary">
            {categories?.find(c => c.code === categoryFilter)?.name.en || categoryFilter}
          </Badge>
        )}
        {accessLevelFilter !== "all" && (
          <Badge variant="secondary">{accessLevelFilter} access</Badge>
        )}
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all" || accessLevelFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by uploading your first document"}
              </p>
              {showUpload && (
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Upload Documents</DialogTitle>
                      <DialogDescription>
                        Upload and organize your project documents
                      </DialogDescription>
                    </DialogHeader>
                    <DocumentUpload
                      projectId={projectId}
                      houseId={houseId}
                      workEntryId={workEntryId}
                      teamId={teamId}
                      onUploadComplete={handleUploadComplete}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-2"
          }
        >
          {documents.map((document) => (
            <DocumentItem
              key={document.id}
              document={document}
              compact={viewMode === "list"}
              onEdit={(doc) => {
                console.log("Edit document:", doc.id);
                // TODO: Implement edit functionality
              }}
              onShare={(doc) => {
                console.log("Share document:", doc.id);
                // TODO: Implement share functionality
              }}
              onViewVersions={(doc) => {
                console.log("View versions:", doc.id);
                // TODO: Implement versions functionality
              }}
            />
          ))}
        </div>
      )}

      {/* Load More / Pagination */}
      {totalDocuments > documents.length && (
        <div className="text-center pt-4">
          <Button variant="outline">
            Load More Documents
          </Button>
        </div>
      )}
    </div>
  );
}