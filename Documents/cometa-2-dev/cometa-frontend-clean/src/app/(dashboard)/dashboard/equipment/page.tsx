"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Settings,
  Plus,
  Filter,
  ArrowLeft,
  Search,
  Wrench,
  Truck,
  Activity,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Package
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useEquipment, useEquipmentAssignments } from "@/hooks/use-equipment";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-200",
  in_use: "bg-blue-100 text-blue-800 border-blue-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  broken: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  available: "Available",
  in_use: "In Use",
  maintenance: "Maintenance",
  broken: "Broken",
};

const statusIcons = {
  available: CheckCircle,
  in_use: Activity,
  maintenance: Clock,
  broken: XCircle,
};

const typeColors = {
  machine: "bg-purple-100 text-purple-800 border-purple-200",
  tool: "bg-orange-100 text-orange-800 border-orange-200",
  measuring_device: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

const typeLabels = {
  machine: "Machine",
  tool: "Tool",
  measuring_device: "Measuring Device",
};

export default function EquipmentPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    owned: "",
    search: "",
  });

  const { data: equipmentData, isLoading } = useEquipment({
    ...filters,
    per_page: 1000
  });
  const { data: assignments } = useEquipmentAssignments({ active_only: true });

  const equipment = equipmentData?.items || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? "" : value,
    }));
  };

  const handleDeleteEquipment = async (equipmentId: string, equipmentName: string) => {
    if (!confirm(`Are you sure you want to delete "${equipmentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete equipment');
      }

      toast.success(`Equipment "${equipmentName}" deleted successfully`);

      // Refresh the page to update the equipment list
      window.location.reload();
    } catch (error) {
      console.error('Delete equipment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete equipment');
    }
  };

  // Calculate statistics
  const stats = equipment.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.totalValue += item.purchase_price_eur || 0;

      if (item.status === "available") acc.available += 1;
      else if (item.status === "in_use") acc.inUse += 1;
      else if (item.status === "maintenance") acc.maintenance += 1;
      else if (item.status === "broken") acc.broken += 1;

      if (item.owned) acc.owned += 1;
      else acc.rented += 1;

      return acc;
    },
    {
      total: 0,
      totalValue: 0,
      available: 0,
      inUse: 0,
      maintenance: 0,
      broken: 0,
      owned: 0,
      rented: 0,
    }
  );

  const utilizationRate = stats.total > 0 ? Math.round((stats.inUse / stats.total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
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
            <h1 className="text-3xl font-bold tracking-tight">Equipment Management</h1>
            <p className="text-muted-foreground">
              Manage your equipment fleet, assignments, and maintenance
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Reports
          </Button>
          <Button onClick={() => router.push("/dashboard/equipment/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Equipment</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  €{stats.totalValue.toLocaleString()} value
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                <p className="text-2xl font-bold">{utilizationRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.inUse} in use
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready for assignment
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attention Needed</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.maintenance + stats.broken}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maintenance & repairs
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="fleet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fleet" className="flex items-center space-x-2">
            <Wrench className="h-4 w-4" />
            <span>Equipment Fleet</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Assignments</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Usage & Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Management</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search equipment..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={filters.type || "all"} onValueChange={(value) => handleFilterChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="machine">Machines</SelectItem>
                      <SelectItem value="tool">Tools</SelectItem>
                      <SelectItem value="measuring_device">Measuring Devices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="broken">Broken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ownership</label>
                  <Select value={filters.owned || "all"} onValueChange={(value) => handleFilterChange("owned", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Owned</SelectItem>
                      <SelectItem value="false">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ type: "", status: "", owned: "", search: "" })}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Table */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Fleet</CardTitle>
              <CardDescription>
                {equipment.length} equipment item{equipment.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {equipment.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ownership</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Daily Rate</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipment.map((item) => {
                        const StatusIcon = statusIcons[item.status as keyof typeof statusIcons];

                        return (
                          <TableRow key={item.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.inventory_no || 'No inventory number'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={typeColors[item.type]}>
                                {typeLabels[item.type]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <StatusIcon className="h-4 w-4" />
                                <Badge className={statusColors[item.status]}>
                                  {statusLabels[item.status]}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={item.owned ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                                {item.owned ? "Owned" : "Rented"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {item.current_location || "Not specified"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                €{item.purchase_price_eur?.toLocaleString() || '0'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                €{item.rental_price_per_day_eur?.toFixed(2) || '0'}/day
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/equipment/${item.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEquipment(item.id, item.name)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No equipment found</h3>
                  <p className="text-muted-foreground">
                    No equipment matches your current filters.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/dashboard/equipment/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Equipment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Assignments</p>
                    <p className="text-2xl font-bold">{assignments?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Equipment currently deployed
                    </p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Projects Covered</p>
                    <p className="text-2xl font-bold">{new Set(assignments?.map(a => a.project_id) || []).size}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active project sites
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Assignment Duration</p>
                    <p className="text-2xl font-bold">14d</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current assignments
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>
                Active equipment assignments across projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments && assignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Expected Return</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => {
                        const assignedEquipment = equipment.find(eq => eq.id === assignment.equipment_id);
                        return (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{assignedEquipment?.name || 'Unknown Equipment'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {assignedEquipment?.inventory_no || 'No inventory #'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{assignment.project_name || assignment.project_id}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{assignment.assigned_to_name || 'Unassigned'}</div>
                            </TableCell>
                            <TableCell>
                              {assignment.start_date ? format(new Date(assignment.start_date), 'MMM dd, yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {assignment.expected_return_date ? format(new Date(assignment.expected_return_date), 'MMM dd, yyyy') : 'Open-ended'}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {assignment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No active assignments</h3>
                  <p className="text-muted-foreground">
                    No equipment is currently assigned to projects.
                  </p>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">2,847h</p>
                    <p className="text-xs text-green-600 mt-1">+12% this month</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                    <p className="text-2xl font-bold">94%</p>
                    <p className="text-xs text-green-600 mt-1">+3% this month</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Downtime</p>
                    <p className="text-2xl font-bold">5.2%</p>
                    <p className="text-xs text-red-600 mt-1">+0.8% this month</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenue Generated</p>
                    <p className="text-2xl font-bold">€18.2k</p>
                    <p className="text-xs text-green-600 mt-1">+15% this month</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Utilization</CardTitle>
                <CardDescription>Usage hours by equipment type</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Current equipment status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusPieChart equipment={equipment} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Monthly equipment performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Maintenance Due</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Equipment needs attention
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Out of Service</p>
                    <p className="text-2xl font-bold text-red-600">{stats.broken}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requiring immediate repair
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
                    <p className="text-2xl font-bold text-green-600">98.5%</p>
                    <p className="text-xs text-green-600 mt-1">
                      Safety & regulatory
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" onClick={() => router.push('/dashboard/equipment/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Equipment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="mr-2 h-4 w-4" />
                  Schedule Maintenance
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Bulk Operations
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
                <CardDescription>Equipment requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipment.filter(eq => eq.status === 'maintenance').slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.inventory_no}</div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {statusLabels[item.status]}
                      </Badge>
                    </div>
                  ))}
                  {equipment.filter(eq => eq.status === 'maintenance').length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      No maintenance scheduled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Categories</CardTitle>
              <CardDescription>Manage equipment by type and category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(typeLabels).map(([type, label]) => {
                  const count = equipment.filter(eq => eq.type === type).length;
                  const value = equipment.filter(eq => eq.type === type).reduce((sum, eq) => sum + (eq.purchase_price_eur || 0), 0);
                  return (
                    <div key={type} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{label}</h4>
                        <Badge className={typeColors[type]}>{count}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Total Value: €{value.toLocaleString()}</p>
                      <div className="mt-3 space-x-2">
                        <Button size="sm" variant="outline">View All</Button>
                        <Button size="sm" variant="ghost">Manage</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Chart Components
const UsageChart = () => {
  const usageData = [
    { name: 'Machines', hours: 1200, revenue: 8400 },
    { name: 'Tools', hours: 800, revenue: 3200 },
    { name: 'Measuring Devices', hours: 400, revenue: 1600 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={usageData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="hours" fill="#3b82f6" name="Usage Hours" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const StatusPieChart = ({ equipment }: { equipment: any[] }) => {
  const statusData = [
    { name: 'Available', value: equipment.filter(eq => eq.status === 'available').length, color: '#10b981' },
    { name: 'In Use', value: equipment.filter(eq => eq.status === 'in_use').length, color: '#3b82f6' },
    { name: 'Maintenance', value: equipment.filter(eq => eq.status === 'maintenance').length, color: '#f59e0b' },
    { name: 'Broken', value: equipment.filter(eq => eq.status === 'broken').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const PerformanceChart = () => {
  const performanceData = [
    { month: 'Jan', utilization: 85, efficiency: 92, downtime: 4.2 },
    { month: 'Feb', utilization: 88, efficiency: 94, downtime: 3.8 },
    { month: 'Mar', utilization: 82, efficiency: 91, downtime: 5.1 },
    { month: 'Apr', utilization: 90, efficiency: 95, downtime: 3.2 },
    { month: 'May', utilization: 87, efficiency: 93, downtime: 4.5 },
    { month: 'Jun', utilization: 91, efficiency: 96, downtime: 2.8 },
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={performanceData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="utilization" stroke="#3b82f6" name="Utilization %" strokeWidth={2} />
        <Line type="monotone" dataKey="efficiency" stroke="#10b981" name="Efficiency %" strokeWidth={2} />
        <Line type="monotone" dataKey="downtime" stroke="#ef4444" name="Downtime %" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};