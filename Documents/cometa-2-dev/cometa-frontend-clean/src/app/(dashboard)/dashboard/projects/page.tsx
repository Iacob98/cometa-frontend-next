"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Building2, MapPin, Calendar, Users, Eye, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useProjects, useDeleteProject } from "@/hooks/use-projects";
import { usePermissions } from "@/hooks/use-auth";
import type { ProjectStatus } from "@/types";

export default function ProjectsPage() {
  const router = useRouter();
  const { canManageProjects } = usePermissions();
  const deleteProject = useDeleteProject();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  const { data: projectsResponse, isLoading, error } = useProjects({
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    page: 1,
    per_page: 20,
  });

  const projects = projectsResponse?.items || [];

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      await deleteProject.mutateAsync(projectId);
    }
  };

  const getStatusBadgeVariant = (status: ProjectStatus) => {
    switch (status) {
      case "active":
        return "default";
      case "draft":
        return "secondary";
      case "waiting_invoice":
        return "outline";
      case "closed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case "active":
        return "Active";
      case "draft":
        return "Draft";
      case "waiting_invoice":
        return "Waiting Invoice";
      case "closed":
        return "Closed";
      default:
        return status;
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Failed to load projects. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your fiber optic construction projects
          </p>
        </div>
        {canManageProjects && (
          <Button onClick={() => router.push("/dashboard/projects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Projects</CardTitle>
          <CardDescription>
            Search and filter projects by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects by name, customer, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: ProjectStatus | "all") => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="waiting_invoice">Waiting Invoice</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Projects ({projectsResponse?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                  <div className="h-4 bg-muted animate-pulse rounded w-20" />
                  <div className="h-4 bg-muted animate-pulse rounded w-16" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No projects found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No projects match your current filters."
                  : "Get started by creating your first project."}
              </p>
              {canManageProjects && (
                <Button
                  className="mt-4"
                  onClick={() => router.push("/dashboard/projects/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.total_length_m}m • €{project.base_rate_per_m}/m
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{project.customer || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{project.city || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {project.start_date && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{new Date(project.start_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {project.end_date_plan && (
                          <div className="text-muted-foreground">
                            → {new Date(project.end_date_plan).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, project.progress || 0)}%`,
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {canManageProjects && (
                            <>
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Project
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteProject(project.id, project.name)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Project
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}