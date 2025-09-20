"use client";

import React, { useState } from "react";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Folder,
  Tags,
  Users,
  BarChart3,
  Settings,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DocumentList, DocumentUpload } from "@/components/documents";
import {
  useDocuments,
  useDocumentCategories,
  useSearchDocuments,
} from "@/hooks/use-documents";
import { useAuth } from "@/hooks/use-auth";
import type { DocumentSearchRequest } from "@/types";

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { user } = useAuth();

  // Get document statistics
  const { data: allDocuments } = useDocuments({ page: 1, per_page: 1 });
  const { data: myDocuments } = useDocuments({
    uploaded_by: user?.id,
    page: 1,
    per_page: 1,
  });
  const { data: recentDocuments } = useDocuments({
    uploaded_after: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    page: 1,
    per_page: 1,
  });
  const { data: categories } = useDocumentCategories();

  const searchDocuments = useSearchDocuments();

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    const searchRequest: DocumentSearchRequest = {
      query,
      include_content: true,
      highlight: true,
      fuzzy: true,
    };

    try {
      const results = await searchDocuments.mutateAsync(searchRequest);
      console.log("Search results:", results);
      // TODO: Handle search results display
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const getTabFilters = () => {
    switch (activeTab) {
      case "my":
        return { uploaded_by: user?.id };
      case "recent":
        return {
          uploaded_after: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      case "shared":
        return { access_level: "public" as const };
      default:
        return {};
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Manage your project files and documents
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
                onUploadComplete={() => setUploadDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allDocuments?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Documents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myDocuments?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Uploaded by you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Documents</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentDocuments?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Document types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Global Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Search</CardTitle>
          <CardDescription>
            Search across all documents including their content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search documents and content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchQuery);
                  }
                }}
              />
            </div>
            <Button
              onClick={() => handleSearch(searchQuery)}
              disabled={!searchQuery.trim() || searchDocuments.isPending}
            >
              <Search className="h-4 w-4 mr-2" />
              {searchDocuments.isPending ? "Searching..." : "Search"}
            </Button>
          </div>
          {searchDocuments.data && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Found {searchDocuments.data.total} results
              </p>
              {/* TODO: Display search results */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All Documents
                {allDocuments?.total && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {allDocuments.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="my">
                My Documents
                {myDocuments?.total && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {myDocuments.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="recent">
                Recent
                {recentDocuments?.total && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {recentDocuments.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <DocumentList
            key={activeTab} // Force remount when tab changes
            {...getTabFilters()}
            showUpload={false}
            title=""
            description=""
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Browse by Category
            </CardTitle>
            <CardDescription>
              Explore documents organized by type and category
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Document Analytics
            </CardTitle>
            <CardDescription>
              View storage usage and document statistics
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Document Settings
            </CardTitle>
            <CardDescription>
              Manage categories, access controls, and preferences
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}