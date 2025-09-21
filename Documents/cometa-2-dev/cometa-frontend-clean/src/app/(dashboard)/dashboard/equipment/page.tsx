"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/equipment/${item.id}`)}
                              >
                                View
                              </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>
                Active equipment assignments across projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Assignment management coming soon</h3>
                <p className="text-muted-foreground">
                  Equipment assignment tracking will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Equipment utilization and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Analytics dashboard coming soon</h3>
                <p className="text-muted-foreground">
                  Usage tracking and analytics will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Management</CardTitle>
              <CardDescription>
                Add, edit, and manage your equipment inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Management interface coming soon</h3>
                <p className="text-muted-foreground">
                  Advanced equipment management tools will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}