"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, User, CheckCircle, Clock, Edit, Trash2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useWorkEntry, useDeleteWorkEntry } from "@/hooks/use-work-entries";
import { requireAuth } from "@/lib/auth";

interface WorkEntryDetailsPageProps {
  params: { id: string };
}

export default function WorkEntryDetailsPage({ params }: WorkEntryDetailsPageProps) {
  requireAuth();

  const router = useRouter();
  const { data: workEntry, isLoading, error } = useWorkEntry(params.id);
  const deleteWorkEntry = useDeleteWorkEntry();

  const handleDeleteWorkEntry = async () => {
    if (confirm("Are you sure you want to delete this work entry? This action cannot be undone.")) {
      await deleteWorkEntry.mutateAsync(params.id);
      router.push("/dashboard/work-entries");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending_approval":
        return "secondary";
      case "in_progress":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending_approval":
        return "Pending Approval";
      case "in_progress":
        return "In Progress";
      default:
        return status;
    }
  };

  const getMethodLabel = (method: string | null) => {
    switch (method) {
      case "hand":
        return "Manual";
      case "excavator":
        return "Excavator";
      case "trencher":
        return "Trencher";
      case "mole":
        return "Mole";
      default:
        return method || "—";
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight">Work Entry Details</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Failed to load work entry. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight">Work Entry Details</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                  <div className="h-4 bg-muted animate-pulse rounded w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workEntry) {
    return (
      <div className="space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight">Work Entry Details</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Work entry not found.
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
            <h1 className="text-3xl font-bold tracking-tight">Work Entry Details</h1>
            <p className="text-muted-foreground">
              {workEntry.task} • {workEntry.project_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteWorkEntry}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Work Details</span>
                </CardTitle>
                <Badge variant={getStatusBadgeVariant(workEntry.status)}>
                  {getStatusLabel(workEntry.status)}
                </Badge>
              </div>
              <CardDescription>
                {workEntry.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stage</label>
                  <p className="font-medium">{workEntry.task}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Method</label>
                  <p className="font-medium">{getMethodLabel(workEntry.method)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Meters Completed</label>
                  <p className="font-medium">{workEntry.meters_done}m</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="font-medium">{new Date(workEntry.date).toLocaleDateString()}</p>
                </div>
              </div>

              {(workEntry.width_m || workEntry.depth_m || workEntry.cables_count) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    {workEntry.width_m && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Width</label>
                        <p className="font-medium">{workEntry.width_m}m</p>
                      </div>
                    )}
                    {workEntry.depth_m && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Depth</label>
                        <p className="font-medium">{workEntry.depth_m}m</p>
                      </div>
                    )}
                    {workEntry.cables_count && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Cables</label>
                        <p className="font-medium">{workEntry.cables_count}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {workEntry.has_protection_pipe && (
                <>
                  <Separator />
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Protection pipe installed</span>
                  </div>
                </>
              )}

              {workEntry.soil_type && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Soil Type</label>
                    <p className="font-medium">{workEntry.soil_type}</p>
                  </div>
                </>
              )}

              {workEntry.notes && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-sm text-muted-foreground">{workEntry.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Photos Section */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Work progress and completion photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workEntry.photos && workEntry.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {workEntry.photos.map((photo, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg">
                      <img
                        src={photo}
                        alt={`Work photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No photos uploaded for this work entry.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Project</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-medium">{workEntry.project_name}</p>
              </div>
              {workEntry.project_customer && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="font-medium">{workEntry.project_customer}</p>
                </div>
              )}
              {workEntry.project_city && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="font-medium">{workEntry.project_city}</p>
                </div>
              )}
              {workEntry.project_address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-sm text-muted-foreground">{workEntry.project_address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Worker Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Worker</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-medium">{workEntry.worker_name}</p>
              </div>
              {workEntry.worker_email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm text-muted-foreground">{workEntry.worker_email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {workEntry.approved ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span>Approval Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant={workEntry.approved ? "default" : "secondary"}>
                  {workEntry.approved ? "Approved" : "Pending Approval"}
                </Badge>
              </div>
              {workEntry.approved && workEntry.approved_by_name && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Approved by</label>
                    <p className="font-medium">{workEntry.approved_by_name}</p>
                  </div>
                  {workEntry.approved_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Approved on</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workEntry.approved_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(workEntry.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(workEntry.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}