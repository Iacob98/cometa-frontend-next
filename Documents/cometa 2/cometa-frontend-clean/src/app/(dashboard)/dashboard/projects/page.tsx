"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/use-projects";
import { useCurrentUser } from "@/hooks/use-auth";
import {
  Plus,
  Search,
  Filter,
  FolderOpen,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Pause
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectsQueryParams, Project } from "@/types";

// Utility function for status badges
function getStatusBadge(status: Project["status"]) {
  const statusConfig = {
    draft: { label: "Draft", variant: "secondary" as const, icon: AlertCircle },
    active: { label: "Active", variant: "default" as const, icon: TrendingUp },
    waiting_invoice: { label: "Waiting Invoice", variant: "outline" as const, icon: Pause },
    closed: { label: "Closed", variant: "destructive" as const, icon: CheckCircle },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function ProjectsPage() {
  const { data: user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");

  const queryParams: ProjectsQueryParams = {
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? (statusFilter as Project["status"]) : undefined,
    page: 1,
    limit: 20,
  };

  const { data: projectsResponse, isLoading, error } = useProjects(queryParams);
  const projects = projectsResponse?.data || [];

  const canCreateProject = user?.role && ["admin", "pm"].includes(user.role);

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading projects</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error.message || "Failed to load projects. Please try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage fiber optic construction projects</p>
        </div>
        {canCreateProject && (
          <Link href="/dashboard/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="waiting_invoice">Waiting Invoice</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Newest</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <ProjectsLoadingSkeleton />
      ) : projects.length === 0 ? (
        <EmptyProjectsState canCreate={!!canCreateProject} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {projectsResponse && projectsResponse.pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={projectsResponse.pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {projectsResponse.pagination.page} of {projectsResponse.pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={projectsResponse.pagination.page === projectsResponse.pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {project.city}
              </CardDescription>
            </div>
            {getStatusBadge(project.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="font-medium">{project.customer}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Length</p>
              <p className="font-medium">{project.total_length_m.toLocaleString()}m</p>
            </div>
            <div>
              <p className="text-gray-500">Rate</p>
              <p className="font-medium">€{project.base_rate_per_m}/m</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(project.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              View details
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-16 mt-1" />
              </div>
              <div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-16 mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface EmptyProjectsStateProps {
  canCreate: boolean;
}

function EmptyProjectsState({ canCreate }: EmptyProjectsStateProps) {
  return (
    <div className="text-center py-12">
      <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {canCreate
          ? "Get started by creating a new project."
          : "No projects match your current filters."}
      </p>
      {canCreate && (
        <div className="mt-6">
          <Link href="/dashboard/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create your first project
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}