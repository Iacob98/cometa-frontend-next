'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Trash2,
  Shield,
  Eye,
  Hammer,
  Crown,
  UserPlus
} from 'lucide-react';
import { useProjectTeams, useGlobalTeams, useProjectUsers, useUpdateTeam } from '@/hooks/use-teams';
import { toast } from 'sonner';

interface TeamAccessProps {
  projectId: string;
}

const USER_ROLES = [
  { value: 'pm', label: '‍ Project Manager', description: 'Full project access' },
  { value: 'foreman', label: ' Foreman', description: 'Team and work management' },
  { value: 'crew', label: ' Crew', description: 'Team tasks only' },
  { value: 'viewer', label: ' Viewer', description: 'View access only' },
];

export default function TeamAccess({ projectId }: TeamAccessProps) {
  const { data: projectTeams, isLoading: projectTeamsLoading } = useProjectTeams(projectId);
  const { data: globalTeams, isLoading: globalTeamsLoading } = useGlobalTeams();
  const { data: projectUsers, isLoading: projectUsersLoading } = useProjectUsers(projectId);
  const updateTeamMutation = useUpdateTeam();

  const [showUserForm, setShowUserForm] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const handleUnassignTeam = async (teamId: string, teamName: string) => {
    if (confirm(`Are you sure you want to unassign team "${teamName}" from this project?`)) {
      try {
        await updateTeamMutation.mutateAsync({
          id: teamId,
          data: {
            project_id: null,
          }
        });
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleAssignTeam = async (teamId: string) => {
    try {
      await updateTeamMutation.mutateAsync({
        id: teamId,
        data: {
          project_id: projectId,
        }
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'pm':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'foreman':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'crew':
        return <Hammer className="w-4 h-4 text-green-600" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-600" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    const roleInfo = USER_ROLES.find(r => r.value === role);
    return roleInfo ? roleInfo.label : role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team & Access Management</h3>
          <p className="text-gray-600">
            Manage project teams and user access permissions
          </p>
        </div>
      </div>

      <Tabs defaultValue="project-teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="project-teams" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Project Teams
          </TabsTrigger>
          <TabsTrigger value="access-control" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Access Control
          </TabsTrigger>
        </TabsList>

        {/* Project Teams Tab */}
        <TabsContent value="project-teams" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Teams Assigned to Project</h4>
            <div className="flex items-center gap-2">
              <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Assign Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Assign Team to Project</DialogTitle>
                    <DialogDescription>
                      Select a team to assign to this project. Only unassigned teams are shown.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {globalTeams?.filter(team => !projectTeams?.find(pt => pt.id === team.id))?.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                        <p>No available teams to assign</p>
                        <p className="text-sm">All teams are already assigned to projects</p>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {globalTeams?.filter(team => !projectTeams?.find(pt => pt.id === team.id))?.map((team) => (
                          <Button
                            key={team.id}
                            variant="ghost"
                            className="justify-start h-auto p-3 border border-gray-200 hover:border-blue-300"
                            onClick={() => {
                              handleAssignTeam(team.id);
                              setShowAssignDialog(false);
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="text-left">
                                <div className="font-medium">{team.name}</div>
                                {team.foreman_name && (
                                  <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    {team.foreman_name}
                                  </div>
                                )}
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <div>{team.member_count || 0} members</div>
                                {team.is_active && (
                                  <div className="text-green-600">Active</div>
                                )}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Teams List */}
          <Card>
            <CardHeader>
              <CardTitle>Project Teams</CardTitle>
              <CardDescription>
                {projectTeams?.length || 0} teams assigned to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectTeamsLoading ? (
                <div>Loading teams...</div>
              ) : !projectTeams || projectTeams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Teams Assigned</h3>
                  <p className="text-gray-600 mb-4">
                    Assign teams from the global teams list to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Name</TableHead>
                        <TableHead>Foreman</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectTeams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">
                            {team.name}
                          </TableCell>
                          <TableCell>
                            {team.foreman_name ? (
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-600" />
                                {team.foreman_name}
                              </div>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={team.is_active ? "default" : "secondary"}
                            >
                              {team.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {team.member_count || 0} members
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnassignTeam(team.id, team.name)}
                              disabled={updateTeamMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                              Unassign
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Statistics */}
          {projectTeams && projectTeams.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{projectTeams.length}</div>
                  <div className="text-sm text-gray-600">Total Teams</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {projectTeams.filter(t => t.foreman_name).length}
                  </div>
                  <div className="text-sm text-gray-600">With Foremen</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {projectTeams.filter(t => t.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Teams</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {projectTeams.reduce((sum, t) => sum + (t.member_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Members</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access-control" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Project Access Control</h4>
            <Button
              onClick={() => setShowUserForm(!showUserForm)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>

          {/* Project Users */}
          <Card>
            <CardHeader>
              <CardTitle>Project Users</CardTitle>
              <CardDescription>
                Users with access to this project and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectUsersLoading ? (
                <div>Loading project users...</div>
              ) : !projectUsers || projectUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Users Assigned</h3>
                  <p className="text-gray-600 mb-4">
                    Add users to grant them access to this project.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Assigned By</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(user.role)}
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.assigned_at}</TableCell>
                          <TableCell>{user.assigned_by}</TableCell>
                          <TableCell>
                            <span className="text-gray-400 text-sm">View only</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Information */}
          <Card>
            <CardHeader>
              <CardTitle>Roles & Access Rights</CardTitle>
              <CardDescription>
                Understanding different user roles and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {USER_ROLES.map((role) => (
                  <div key={role.value} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getRoleIcon(role.value)}
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-sm text-gray-600">{role.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add User Form */}
          {showUserForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add User to Project</CardTitle>
                <CardDescription>
                  Grant a user access to this project with specific role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="user-select">Select User</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user1">John Doe (john@example.com)</SelectItem>
                          <SelectItem value="user2">Jane Smith (jane@example.com)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="role-select">Project Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button disabled>
                      Add User
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUserForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-sm text-blue-600">
                    ℹThis function will be available in future updates
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}