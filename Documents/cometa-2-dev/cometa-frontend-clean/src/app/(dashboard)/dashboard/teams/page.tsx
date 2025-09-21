"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Users, UserPlus, Eye, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useTeams, useDeleteCrew, useCreateTeam, useUpdateTeam, useForemenUsers } from "@/hooks/use-teams";
import { useUsers, useCreateUser } from "@/hooks/use-users";
import { usePermissions } from "@/hooks/use-auth";

// Validation schema for creating users
const createUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().min(10, "Valid phone number is required").optional(),
  role: z.enum(["admin", "pm", "foreman", "crew", "worker", "viewer"]),
  lang_pref: z.enum(["de", "en", "ru", "uz", "tr"]),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

// Validation schema for creating/editing teams
const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  foreman_user_id: z.string().optional(),
  project_id: z.string().optional(),
  description: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

export default function TeamsPage() {
  const router = useRouter();
  const { canManageTeams } = usePermissions();
  const deleteCrew = useDeleteCrew();
  const createUser = useCreateUser();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [showEditTeamDialog, setShowEditTeamDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);

  const createUserForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "crew",
      lang_pref: "de",
    },
  });

  const createTeamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      foreman_user_id: "none",
      project_id: "none",
      description: "",
    },
  });

  const editTeamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      foreman_user_id: "none",
      project_id: "none",
      description: "",
    },
  });

  const { data: crews, isLoading: crewsLoading, error: crewsError } = useTeams();
  const { data: usersResponse, isLoading: usersLoading } = useUsers();
  const { data: foremenUsers } = useForemenUsers();

  const users = usersResponse?.items || [];
  const availableWorkers = users.filter(user =>
    ["crew", "worker", "foreman"].includes(user.role) &&
    !crews?.some(crew =>
      crew.foreman?.id === user.id ||
      crew.members?.some(member => member.user_id === user.id)
    )
  );

  const handleDeleteCrew = async (crewId: string, crewName: string) => {
    if (confirm(`Are you sure you want to delete "${crewName}"? This action cannot be undone.`)) {
      await deleteCrew.mutateAsync(crewId);
    }
  };

  const handleCreateUser = async (data: CreateUserFormData) => {
    try {
      await createUser.mutateAsync(data);
      setShowCreateUserDialog(false);
      createUserForm.reset();
    } catch (error) {
      // Error is handled by the mutation
      console.error("Failed to create user:", error);
    }
  };

  const handleCreateTeam = async (data: TeamFormData) => {
    try {
      // Convert "none" values to undefined for API
      const apiData = {
        ...data,
        foreman_user_id: data.foreman_user_id === "none" ? undefined : data.foreman_user_id,
        project_id: data.project_id === "none" ? undefined : data.project_id,
      };
      await createTeam.mutateAsync(apiData);
      setShowCreateTeamDialog(false);
      createTeamForm.reset();
    } catch (error) {
      // Error is handled by the mutation
      console.error("Failed to create team:", error);
    }
  };

  const handleEditTeam = (team: any) => {
    setEditingTeam(team);
    editTeamForm.setValue("name", team.name);
    editTeamForm.setValue("foreman_user_id", team.foreman?.id || "none");
    editTeamForm.setValue("project_id", team.project_id || "none");
    editTeamForm.setValue("description", team.description || "");
    setShowEditTeamDialog(true);
  };

  const handleUpdateTeam = async (data: TeamFormData) => {
    if (!editingTeam) return;

    try {
      // Convert "none" values to undefined for API
      const apiData = {
        ...data,
        foreman_user_id: data.foreman_user_id === "none" ? undefined : data.foreman_user_id,
        project_id: data.project_id === "none" ? undefined : data.project_id,
      };
      await updateTeam.mutateAsync({ id: editingTeam.id, data: apiData });
      setShowEditTeamDialog(false);
      setEditingTeam(null);
      editTeamForm.reset();
    } catch (error) {
      // Error is handled by the mutation
      console.error("Failed to update team:", error);
    }
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

  if (crewsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Failed to load teams. Please try again later.
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
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage work crews and team assignments
          </p>
        </div>
        {canManageTeams && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                createUserForm.setValue("role", "crew");
                setShowCreateUserDialog(true);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateUserDialog(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
            <Button onClick={() => setShowCreateTeamDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="crews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="crews">Work Crews ({crews?.length || 0})</TabsTrigger>
          <TabsTrigger value="available">Available Workers ({availableWorkers.length})</TabsTrigger>
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="crews" className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Teams</CardTitle>
              <CardDescription>
                Search teams by name or foreman
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams by name, foreman, or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Teams Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {crewsLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : crews?.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold">No teams found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Get started by creating your first work crew.
                      </p>
                      {canManageTeams && (
                        <Button
                          className="mt-4"
                          onClick={() => router.push("/dashboard/teams/new")}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Team
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              crews
                ?.filter(crew =>
                  !searchQuery ||
                  crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  crew.foreman?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((crew) => (
                  <Card key={crew.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{crew.name}</CardTitle>
                        {canManageTeams && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/teams/${crew.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditTeam(crew)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Team
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteCrew(crew.id, crew.name)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Foreman */}
                      {crew.foreman && (
                        <div className="flex items-center space-x-3">
                          <Badge variant="default">Foreman</Badge>
                          <div>
                            <div className="font-medium text-sm">{crew.foreman.full_name}</div>
                            <div className="text-xs text-muted-foreground flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{crew.foreman.phone || "—"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Team Members */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>Team Members ({crew.members?.length || 0})</span>
                        </div>
                        {crew.members?.length ? (
                          <div className="space-y-1">
                            {crew.members.slice(0, 3).map((member) => (
                              <div key={member.id} className="flex items-center justify-between text-sm">
                                <span>{member.user?.full_name || "Unknown"}</span>
                                <Badge variant={getRoleColor(member.user?.role || "")}>
                                  {member.user?.role || "—"}
                                </Badge>
                              </div>
                            ))}
                            {crew.members.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{crew.members.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No members assigned</div>
                        )}
                      </div>

                      {/* Project Assignment */}
                      {crew.project_id && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>Assigned to Project {crew.project_id}</span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/dashboard/teams/${crew.id}`)}
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          View
                        </Button>
                        {canManageTeams && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEditTeam(crew)}
                          >
                            <Edit className="mr-2 h-3 w-3" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Available Workers ({availableWorkers.length})
              </CardTitle>
              <CardDescription>
                Workers not currently assigned to any team
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
              ) : availableWorkers.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">All workers assigned</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    All available workers are currently assigned to teams.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableWorkers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {canManageTeams && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/teams/new?user=${user.id}`)}
                            >
                              <UserPlus className="mr-2 h-3 w-3" />
                              Assign
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crews?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active work crews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {crews?.reduce((sum, crew) => sum + (crew.members?.length || 0), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Assigned to teams
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Workers</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableWorkers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Not assigned to teams
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(crews?.filter(c => c.project_id).map(c => c.project_id)).size || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  With assigned teams
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Performance Overview</CardTitle>
              <CardDescription>
                Team productivity and workload analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Team performance analytics will be implemented with work entry data integration.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. A PIN code will be automatically generated.
            </DialogDescription>
          </DialogHeader>
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(handleCreateUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createUserForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createUserForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+49 30 12345678"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="pm">Project Manager</SelectItem>
                          <SelectItem value="foreman">Foreman</SelectItem>
                          <SelectItem value="crew">Crew Member</SelectItem>
                          <SelectItem value="worker">Worker</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createUserForm.control}
                  name="lang_pref"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ru">Russian</SelectItem>
                          <SelectItem value="uz">Uzbek</SelectItem>
                          <SelectItem value="tr">Turkish</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateUserDialog(false);
                    createUserForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Create User
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new work crew/team with a name and optional foreman assignment.
            </DialogDescription>
          </DialogHeader>
          <Form {...createTeamForm}>
            <form onSubmit={createTeamForm.handleSubmit(handleCreateTeam)} className="space-y-4">
              <FormField
                control={createTeamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alpha Team, Fiber Crew 1" {...field} />
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
                    <FormLabel>Foreman (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select foreman..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No foreman assigned</SelectItem>
                        {foremenUsers?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.role})
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Team specialization or notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateTeamDialog(false);
                    createTeamForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createTeam.isPending}>
                  {createTeam.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create Team
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={showEditTeamDialog} onOpenChange={setShowEditTeamDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team information and assignments.
            </DialogDescription>
          </DialogHeader>
          <Form {...editTeamForm}>
            <form onSubmit={editTeamForm.handleSubmit(handleUpdateTeam)} className="space-y-4">
              <FormField
                control={editTeamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alpha Team, Fiber Crew 1" {...field} />
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
                    <FormLabel>Foreman</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select foreman..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No foreman assigned</SelectItem>
                        {foremenUsers?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.role})
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Team specialization or notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditTeamDialog(false);
                    setEditingTeam(null);
                    editTeamForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTeam.isPending}>
                  {updateTeam.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                  ) : (
                    <Edit className="mr-2 h-4 w-4" />
                  )}
                  Update Team
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}