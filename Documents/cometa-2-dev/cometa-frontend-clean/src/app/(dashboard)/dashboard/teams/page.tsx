"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

import { useTeams, useDeleteCrew } from "@/hooks/use-teams";
import { useUsers } from "@/hooks/use-users";
import { usePermissions } from "@/hooks/use-auth";

export default function TeamsPage() {
  const router = useRouter();
  const { canManageTeams } = usePermissions();
  const deleteCrew = useDeleteCrew();

  const [searchQuery, setSearchQuery] = useState("");

  const { data: crews, isLoading: crewsLoading, error: crewsError } = useTeams();
  const { data: usersResponse, isLoading: usersLoading } = useUsers();

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
          <Button onClick={() => router.push("/dashboard/teams/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Team
          </Button>
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
                                onClick={() => router.push(`/dashboard/teams/${crew.id}/edit`)}
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
                            onClick={() => router.push(`/dashboard/teams/${crew.id}/edit`)}
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
    </div>
  );
}