"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject, useProjectProgress, useDeleteProject } from "@/hooks/use-projects";
import { useCurrentUser } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Euro,
  Ruler,
  TrendingUp,
  Users,
  ClipboardList,
  Package,
  AlertCircle,
  CheckCircle,
  Pause,
  Activity
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { data: user } = useCurrentUser();
  const { data: project, isLoading: isLoadingProject, error } = useProject(projectId);
  const { data: progress, isLoading: isLoadingProgress } = useProjectProgress(projectId);
  const deleteProjectMutation = useDeleteProject();

  const [activeTab, setActiveTab] = useState("overview");

  const canEdit = user?.role && ["admin", "pm"].includes(user.role);
  const canDelete = user?.role === "admin";

  const handleDelete = async () => {
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading project</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error.message || "Failed to load project details. Please try again."}
        </p>
        <div className="mt-6">
          <Link href="/dashboard/projects">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingProject) {
    return <ProjectDetailsSkeleton />;
  }

  if (!project) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
        <div className="mt-6">
          <Link href="/dashboard/projects">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const, icon: AlertCircle },
      active: { label: "Active", variant: "default" as const, icon: TrendingUp },
      waiting_invoice: { label: "Waiting Invoice", variant: "outline" as const, icon: Pause },
      closed: { label: "Closed", variant: "destructive" as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const progressPercentage = progress ? (progress.completed_meters / progress.total_meters) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {getStatusBadge(project.status)}
            </div>
            <div className="flex items-center space-x-4 text-gray-600 mt-1">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {project.city}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{project.name}"? This action cannot be undone.
                    All work entries, materials, and data associated with this project will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleteProjectMutation.isPending}
                  >
                    {deleteProjectMutation.isPending ? "Deleting..." : "Delete Project"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <Ruler className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {project.total_length_m.toLocaleString()}m
                </p>
                <p className="text-sm text-gray-600">Total Length</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  €{project.base_rate_per_m.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Rate per Meter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingProgress ? "..." : `${progressPercentage.toFixed(1)}%`}
                </p>
                <p className="text-sm text-gray-600">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-100">
                <Euro className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  €{(project.total_length_m * project.base_rate_per_m).toLocaleString("de-DE", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="work-entries">Work Entries</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Customer</p>
                  <p className="text-gray-900">{project.customer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">City</p>
                  <p className="text-gray-900">{project.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <div className="mt-1">{getStatusBadge(project.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-gray-900">{new Date(project.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Last Updated</p>
                  <p className="text-gray-900">{new Date(project.updated_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProgress ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : progress ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Completed</span>
                        <span>{progressPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Completed</p>
                        <p className="font-medium">{progress.completed_meters.toLocaleString()}m</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Remaining</p>
                        <p className="font-medium">
                          {(progress.total_meters - progress.completed_meters).toLocaleString()}m
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Work Entries</p>
                        <p className="font-medium">{progress.work_entries_count}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No progress data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Progress</CardTitle>
              <CardDescription>
                Track completion status and milestones for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Progress tracking details will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-entries">
          <Card>
            <CardHeader>
              <CardTitle>Work Entries</CardTitle>
              <CardDescription>
                View all work entries logged for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Work entries list will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Project Teams</CardTitle>
              <CardDescription>
                Manage team assignments for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Team management will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Materials & Equipment</CardTitle>
              <CardDescription>
                Track materials allocation and equipment usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Materials management will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-20" />
          <div>
            <Skeleton className="h-8 w-64" />
            <div className="flex items-center space-x-4 mt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}