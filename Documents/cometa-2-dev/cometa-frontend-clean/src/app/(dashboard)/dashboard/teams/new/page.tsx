"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Users, UserPlus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useUsers } from "@/hooks/use-users";
import { useCreateCrew } from "@/hooks/use-teams";
import { useProjects } from "@/hooks/use-projects";

// Validation schema for creating teams
const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  foreman_user_id: z.string().optional(),
  project_id: z.string().optional(),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

export default function NewTeamPage() {
  const router = useRouter();
  const createCrew = useCreateCrew();

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const createTeamForm = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      foreman_user_id: "",
      project_id: "",
    },
  });

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

  // Filter users by role for different selections
  const foremen = users.filter(user => ["foreman", "pm", "admin"].includes(user.role));
  const workers = users.filter(user =>
    ["crew", "worker", "foreman"].includes(user.role) &&
    !selectedMembers.includes(user.id)
  );

  const handleCreateTeam = async (data: CreateTeamFormData) => {
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

      await createCrew.mutateAsync(teamData);
      router.push("/dashboard/teams");
    } catch (error) {
      console.error("Failed to create team:", error);
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
            <h1 className="text-3xl font-bold tracking-tight">Create New Team</h1>
            <p className="text-muted-foreground">
              Set up a new work crew with team members and assignments
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Information</span>
            </CardTitle>
            <CardDescription>
              Basic team details and leadership assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createTeamForm}>
              <form onSubmit={createTeamForm.handleSubmit(handleCreateTeam)} className="space-y-4">
                <FormField
                  control={createTeamForm.control}
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
                  control={createTeamForm.control}
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
                  control={createTeamForm.control}
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
                    onClick={() => router.back()}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCrew.isPending}>
                    {createCrew.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Create Team
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Team Members Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Team Members ({selectedMembers.length})</span>
            </CardTitle>
            <CardDescription>
              Select workers to add to this team
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}