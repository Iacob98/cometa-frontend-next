"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, MapPin, Calendar, Users, TrendingUp, AlertTriangle, Building2, Phone, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import { useProject } from "@/hooks/use-projects";
import { usePermissions } from "@/hooks/use-auth";
import type { ProjectStatus } from "@/types";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { canManageProjects } = usePermissions();

  const projectId = params.id as string;
  const { data: project, isLoading, error } = useProject(projectId);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Project not found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data for demonstration
  const mockProgress = {
    totalLength: project.total_length_m,
    completedLength: Math.floor(project.total_length_m * 0.65), // 65% complete
    progressPercentage: 65,
    workEntries: 23,
    pendingApprovals: 3,
    teamMembers: 8,
  };

  const mockPhase = {
    currentPhase: 6,
    totalPhases: 10,
    phaseName: "Materials Procurement",
    phaseProgress: 80,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={getStatusBadgeVariant(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Project Details • {project.total_length_m}m fiber installation
            </p>
          </div>
        </div>
        {canManageProjects && (
          <Button onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockProgress.progressPercentage}%</div>
            <Progress value={mockProgress.progressPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {mockProgress.completedLength}m of {mockProgress.totalLength}m completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Entries</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockProgress.workEntries}</div>
            <p className="text-xs text-muted-foreground">
              {mockProgress.pendingApprovals} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockProgress.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active on this project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Phase</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPhase.currentPhase}/{mockPhase.totalPhases}</div>
            <p className="text-xs text-muted-foreground">
              {mockPhase.phaseName}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>
                  Basic details and specifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                    <p className="text-sm">{project.customer || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">City</p>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm">{project.city || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Length</p>
                    <p className="text-sm font-mono">{project.total_length_m} meters</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rate per Meter</p>
                    <p className="text-sm font-mono">€{project.base_rate_per_m}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Project Value</p>
                    <p className="text-sm font-mono font-semibold">
                      €{(project.total_length_m * project.base_rate_per_m).toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Language</p>
                    <div className="flex items-center space-x-1">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm">{project.language_default?.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {project.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-sm">{project.address}</p>
                  </div>
                )}

                {project.contact_24h && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">24h Contact</p>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm">{project.contact_24h}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  Important dates and milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.start_date && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Start Date</span>
                    </div>
                    <span className="text-sm">
                      {new Date(project.start_date).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {project.end_date_plan && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Planned End</span>
                    </div>
                    <span className="text-sm">
                      {new Date(project.end_date_plan).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {project.start_date && project.end_date_plan && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Duration</span>
                      <span className="text-sm">
                        {Math.ceil(
                          (new Date(project.end_date_plan).getTime() - new Date(project.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                        )} days
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Progress Overview</CardTitle>
              <CardDescription>
                Track progress across different aspects of the project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">{mockProgress.progressPercentage}%</span>
                  </div>
                  <Progress value={mockProgress.progressPercentage} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Phase Progress</span>
                    <span className="text-sm text-muted-foreground">{mockPhase.phaseProgress}%</span>
                  </div>
                  <Progress value={mockPhase.phaseProgress} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Phase {mockPhase.currentPhase}: {mockPhase.phaseName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Assignment</CardTitle>
              <CardDescription>
                Team members working on this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Team management functionality will be implemented in the next phase.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>
                Files, plans, and documentation related to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Document management functionality will be implemented in the next phase.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>
                Budget, costs, and financial tracking for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Project Budget</p>
                  <p className="text-lg font-mono">
                    €{(project.total_length_m * project.base_rate_per_m).toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Spent to Date</p>
                  <p className="text-lg font-mono">
                    €{((project.total_length_m * project.base_rate_per_m) * 0.45).toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}