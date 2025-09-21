"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Users,
  Edit,
  Save,
  X,
  MapPin,
  Calendar,
  Mail,
  Phone,
  UserPlus,
  Trash2,
  Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useCrew, useUpdateCrew, useDeleteCrew } from "@/hooks/use-teams";
import { useUsers } from "@/hooks/use-users";
import { useProjects } from "@/hooks/use-projects";
import { usePermissions } from "@/hooks/use-auth";
import WorkerDocumentsDialog from "@/components/documents/worker-documents-dialog";

// Validation schema for editing teams
const editTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  foreman_user_id: z.string().optional(),
  project_id: z.string().optional(),
});

type EditTeamFormData = z.infer<typeof editTeamSchema>;

export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { canManageTeams } = usePermissions();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const teamId = params.id as string;
  const { data: crew, isLoading: crewLoading, error } = useCrew(teamId);
  const updateCrew = useUpdateCrew();
  const deleteCrew = useDeleteCrew();

  const { data: usersResponse, isLoading: usersLoading } = useUsers({
    page: 1,
    per_page: 100
  });
  const { data: projectsResponse, isLoading: projectsLoading } = useProjects({
    page: 1,
    per_page: 50
  });

  const users = usersResponse?.items || [];
  const projects = projectsResponse?.items || [];

  const editTeamForm = useForm<EditTeamFormData>({
    resolver: zodResolver(editTeamSchema),
    defaultValues: {
      name: crew?.name || "",
      foreman_user_id: crew?.foreman_user_id || "",
      project_id: crew?.project_id || "",
    },
  });

  // Update form when crew data loads
  useEffect(() => {
    if (crew) {
      editTeamForm.reset({
        name: crew.name,
        foreman_user_id: crew.foreman_user_id || "",
        project_id: crew.project_id || "",
      });
      setSelectedMembers(crew.members?.map(m => m.user_id) || []);
    }
  }, [crew, editTeamForm]);

  const foremen = users.filter(user => ["foreman", "pm", "admin"].includes(user.role));
  const workers = users.filter(user =>
    ["crew", "worker", "foreman"].includes(user.role) &&
    !selectedMembers.includes(user.id)
  );

  const handleUpdateTeam = async (data: EditTeamFormData) => {
    if (!crew) return;

    try {
      const teamData = {
        name: data.name,
        foreman_user_id: data.foreman_user_id === "none" ? undefined : data.foreman_user_id,
        project_id: data.project_id === "none" ? undefined : data.project_id,
        members: selectedMembers.map(userId => ({
          user_id: userId,
          role_in_crew: "worker"
        }))
      };

      await updateCrew.mutateAsync({ id: crew.id, data: teamData });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update team:", error);
    }
  };

  const handleDeleteTeam = async () => {
    if (!crew) return;

    try {
      await deleteCrew.mutateAsync(crew.id);
      router.push("/dashboard/teams");
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "foreman":
        return "default";
      case "crew":
      case "worker":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (crewLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-20 bg-muted animate-pulse rounded" />
          <div>
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 mt-2 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error || !crew) {
    return (
      <div className="space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight text-destructive">Team Not Found</h1>
            <p className="text-muted-foreground">
              The team you're looking for doesn't exist or has been deleted.
            </p>
          </div>
        </div>
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
            <h1 className="text-3xl font-bold tracking-tight">{crew.name}</h1>
            <p className="text-muted-foreground">
              Team details and member management
            </p>
          </div>
        </div>
        {canManageTeams && (
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Team</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{crew.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteTeam}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Team Information</span>
            </CardTitle>
            <CardDescription>
              Basic team details and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Team Name</Label>
                  <p className="text-lg">{crew.name}</p>
                </div>

                {crew.foreman && (
                  <div>
                    <Label className="text-sm font-medium">Team Leader / Foreman</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="default">{crew.foreman.role}</Badge>
                      <span className="text-sm">{crew.foreman.full_name}</span>
                    </div>
                    {crew.foreman.email && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        <span>{crew.foreman.email}</span>
                      </div>
                    )}
                    {crew.foreman.phone && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{crew.foreman.phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {crew.project_name && (
                  <div>
                    <Label className="text-sm font-medium">Assigned Project</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{crew.project_name}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{crew.status}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(crew.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <Form {...editTeamForm}>
                <form onSubmit={editTeamForm.handleSubmit(handleUpdateTeam)} className="space-y-4">
                  <FormField
                    control={editTeamForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Installation Team Alpha"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editTeamForm.control}
                    name="foreman_user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Leader / Foreman</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team leader" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No leader assigned</SelectItem>
                            {foremen.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name} ({user.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editTeamForm.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Project</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No project assigned</SelectItem>
                            {projectsLoading ? (
                              <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                            ) : (
                              projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateCrew.isPending}>
                      {updateCrew.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Members ({crew.members?.length || 0})</span>
            </CardTitle>
            <CardDescription>
              Current team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              // View mode - show current members
              <div className="space-y-3">
                {crew.members?.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No team members</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This team doesn't have any members assigned yet.
                    </p>
                  </div>
                ) : (
                  crew.members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{member.user.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {member.user.email || member.user.phone || "No contact info"}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getRoleColor(member.user.role || "")}>
                          {member.user.role}
                        </Badge>
                        <Badge variant="outline">
                          {member.role_in_crew}
                        </Badge>
                        <WorkerDocumentsDialog
                          userId={member.user.id}
                          userName={member.user.full_name}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Edit mode - member selection
              <div className="space-y-4">
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                        <div className="h-4 bg-muted animate-pulse rounded w-20" />
                      </div>
                    ))}
                  </div>
                ) : workers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No available workers</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      All workers are currently assigned to other teams.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {workers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleMember(user.id)}
                      >
                        <Checkbox
                          checked={selectedMembers.includes(user.id)}
                          onChange={() => toggleMember(user.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.email || user.phone || "No contact info"}
                          </div>
                        </div>
                        <Badge variant={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm font-medium">Selected Members</Label>
                    <div className="mt-2 space-y-2">
                      {selectedMembers.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return user ? (
                          <div key={userId} className="flex items-center justify-between text-sm">
                            <span>{user.full_name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMember(userId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}