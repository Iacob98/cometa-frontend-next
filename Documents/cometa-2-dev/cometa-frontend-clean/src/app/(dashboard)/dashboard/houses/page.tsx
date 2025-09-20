"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Home,
  Calendar,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Eye,
  Edit,
  Trash2,
  CalendarPlus,
  Play,
  CheckSquare,
} from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useHouses,
  usePendingConnections,
  useScheduledAppointments,
  useInProgressConnections,
  useCompletedConnections,
  useTodaysAppointments,
  useDeleteHouse,
  useScheduleAppointment,
  useStartConnection,
  useCompleteConnection,
} from "@/hooks/use-houses";
import { useProjects } from "@/hooks/use-projects";
import { useTeams } from "@/hooks/use-teams";
import { usePermissions } from "@/hooks/use-auth";
import type { HouseFilters, HouseConnectionStatus, ConnectionType } from "@/types";

export default function HousesPage() {
  const router = useRouter();
  const { canManageConnections } = usePermissions();
  const deleteHouse = useDeleteHouse();
  const scheduleAppointment = useScheduleAppointment();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<HouseConnectionStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const filters: HouseFilters = {
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    project_id: projectFilter === "all" ? undefined : projectFilter,
    page: 1,
    per_page: 20,
  };

  const { data: housesResponse, isLoading: housesLoading, error: housesError } = useHouses(filters);
  const { data: pendingConnections } = usePendingConnections();
  const { data: scheduledAppointments } = useScheduledAppointments();
  const { data: inProgressConnections } = useInProgressConnections();
  const { data: completedConnections } = useCompletedConnections();
  const { data: todaysAppointments } = useTodaysAppointments();
  const { data: projectsResponse } = useProjects({ page: 1, per_page: 100 });
  const { data: teams } = useTeams();

  const houses = housesResponse?.items || [];
  const projects = projectsResponse?.items || [];

  const handleDeleteHouse = async (houseId: string, houseNumber: string) => {
    if (confirm(`Are you sure you want to delete house "${houseNumber}"? This action cannot be undone.`)) {
      await deleteHouse.mutateAsync(houseId);
    }
  };

  const getStatusBadgeVariant = (status: HouseConnectionStatus) => {
    switch (status) {
      case "connected":
        return "default";
      case "in_progress":
        return "secondary";
      case "appointment_scheduled":
        return "outline";
      case "postponed":
        return "destructive";
      case "partial_only":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: HouseConnectionStatus) => {
    switch (status) {
      case "not_assigned":
        return "Not Assigned";
      case "appointment_scheduled":
        return "Scheduled";
      case "in_progress":
        return "In Progress";
      case "connected":
        return "Connected";
      case "partial_only":
        return "Partial Only";
      case "postponed":
        return "Postponed";
      default:
        return status;
    }
  };

  const getConnectionTypeLabel = (type: ConnectionType) => {
    return type === "full" ? "Full Connection" : "Partial Connection";
  };

  const getConnectionMethodLabel = (method: string) => {
    return method === "trench" ? "Trenching" : "Mole";
  };

  if (housesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">House Connections</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Failed to load house connections. Please try again later.
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
          <h1 className="text-3xl font-bold tracking-tight">House Connections</h1>
          <p className="text-muted-foreground">
            Manage house connection appointments and track progress
          </p>
        </div>
        {canManageConnections && (
          <Button onClick={() => router.push("/dashboard/houses/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New House
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingConnections?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledAppointments?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Appointments set
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressConnections?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active work
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedConnections?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Connections done
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Appointments today
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Houses ({houses.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingConnections?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledAppointments?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="today">
            Today ({todaysAppointments?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedConnections?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Houses</CardTitle>
              <CardDescription>
                Search and filter house connections by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by house number, address, or customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value: HouseConnectionStatus | "all") => setStatusFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="not_assigned">Not Assigned</SelectItem>
                    <SelectItem value="appointment_scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="partial_only">Partial Only</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Houses Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                House Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {housesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                      <div className="h-4 bg-muted animate-pulse rounded w-20" />
                      <div className="h-4 bg-muted animate-pulse rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : houses.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No houses found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || projectFilter !== "all"
                      ? "No houses match your current filters."
                      : "Get started by adding houses for connection."}
                  </p>
                  {canManageConnections && (
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/dashboard/houses/new")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add House
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>House & Address</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Connection Info</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Team</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {houses.map((house) => (
                      <TableRow key={house.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">#{house.house_number}</div>
                            <div className="text-sm text-muted-foreground flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{house.address}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {house.customer_name && (
                              <div className="font-medium text-sm">{house.customer_name}</div>
                            )}
                            {house.customer_contact && (
                              <div className="text-sm text-muted-foreground flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{house.customer_contact}</span>
                              </div>
                            )}
                            {!house.customer_name && !house.customer_contact && (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {house.project?.name || `Project ${house.project_id}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {getConnectionTypeLabel(house.connection_type)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getConnectionMethodLabel(house.connection_method)} • {house.estimated_length_m}m
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(house.status)}>
                            {getStatusLabel(house.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {house.assigned_team?.name || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {house.scheduled_date ? (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(house.scheduled_date).toLocaleDateString()}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
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
                                onClick={() => router.push(`/dashboard/houses/${house.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {canManageConnections && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/houses/${house.id}/edit`)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit House
                                  </DropdownMenuItem>
                                  {house.status === "not_assigned" && (
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/houses/${house.id}/schedule`)}
                                    >
                                      <CalendarPlus className="mr-2 h-4 w-4" />
                                      Schedule Appointment
                                    </DropdownMenuItem>
                                  )}
                                  {house.status === "appointment_scheduled" && (
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/houses/${house.id}/start`)}
                                    >
                                      <Play className="mr-2 h-4 w-4" />
                                      Start Connection
                                    </DropdownMenuItem>
                                  )}
                                  {house.status === "in_progress" && (
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/houses/${house.id}/complete`)}
                                    >
                                      <CheckSquare className="mr-2 h-4 w-4" />
                                      Complete Connection
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteHouse(house.id, house.house_number)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete House
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
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Pending Connections
              </CardTitle>
              <CardDescription>
                Houses awaiting team assignment and appointment scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Pending connections management will be implemented with team assignment interface.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Appointments
              </CardTitle>
              <CardDescription>
                Houses with confirmed appointment dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Scheduled appointments calendar view will be implemented.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today&apos;s Appointments
              </CardTitle>
              <CardDescription>
                Appointments scheduled for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Today&apos;s appointments dashboard will be implemented with real-time status updates.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed Connections
              </CardTitle>
              <CardDescription>
                Successfully completed house connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Completed connections history and statistics will be implemented.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}