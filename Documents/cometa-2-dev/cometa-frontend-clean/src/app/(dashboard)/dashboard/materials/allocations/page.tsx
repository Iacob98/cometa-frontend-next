"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Filter, ArrowLeft, Calendar, Package, Target, User, TrendingUp, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useAllocations } from "@/hooks/use-allocations";
import { useProjects } from "@/hooks/use-projects";
import { useCrews } from "@/hooks/use-crews";

const statusColors = {
  allocated: "bg-blue-100 text-blue-800 border-blue-200",
  partially_used: "bg-yellow-100 text-yellow-800 border-yellow-200",
  fully_used: "bg-green-100 text-green-800 border-green-200",
  returned: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels = {
  allocated: "Allocated",
  partially_used: "Partially Used",
  fully_used: "Fully Used",
  returned: "Returned",
};

export default function MaterialAllocationsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: "",
    project_id: "",
    crew_id: "",
    material_id: "",
  });

  const { data: allocations, isLoading } = useAllocations(filters);
  const { data: projects } = useProjects({ status: "active" });
  const { data: crews } = useCrews();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? "" : value,
    }));
  };

  // Calculate statistics
  const stats = allocations?.reduce(
    (acc, allocation) => {
      acc.totalValue += allocation.total_value;
      acc.totalAllocated += allocation.allocated_qty;
      acc.totalUsed += allocation.used_qty;

      if (allocation.status === "allocated") acc.activeAllocations++;

      return acc;
    },
    {
      totalValue: 0,
      totalAllocated: 0,
      totalUsed: 0,
      activeAllocations: 0,
    }
  ) || {
    totalValue: 0,
    totalAllocated: 0,
    totalUsed: 0,
    activeAllocations: 0,
  };

  const utilizationRate = stats.totalAllocated > 0
    ? Math.round((stats.totalUsed / stats.totalAllocated) * 100)
    : 0;

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
            <h1 className="text-3xl font-bold tracking-tight">Material Allocations</h1>
            <p className="text-muted-foreground">
              Track and manage material allocations to projects and crews
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/dashboard/materials/allocations/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Allocation
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">€{stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All allocations
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
                <p className="text-sm font-medium text-muted-foreground">Active Allocations</p>
                <p className="text-2xl font-bold">{stats.activeAllocations}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently allocated
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
                  Materials used vs allocated
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Allocations</p>
                <p className="text-2xl font-bold">{allocations?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All time
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="allocated">Allocated</SelectItem>
                  <SelectItem value="partially_used">Partially Used</SelectItem>
                  <SelectItem value="fully_used">Fully Used</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select value={filters.project_id || "all"} onValueChange={(value) => handleFilterChange("project_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects?.items?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Crew</label>
              <Select value={filters.crew_id || "all"} onValueChange={(value) => handleFilterChange("crew_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All crews" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All crews</SelectItem>
                  {crews?.map((crew) => (
                    <SelectItem key={crew.id} value={crew.id}>
                      {crew.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ status: "", project_id: "", crew_id: "", material_id: "" })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Allocations</CardTitle>
          <CardDescription>
            {allocations?.length || 0} allocation{allocations?.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allocations && allocations.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Allocated By</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((allocation) => (
                    <TableRow key={allocation.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(allocation.allocation_date), 'MMM dd, yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{allocation.material.name}</p>
                          <p className="text-sm text-muted-foreground">
                            €{allocation.material.default_price_eur.toFixed(2)}/{allocation.material.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {allocation.allocated_qty.toLocaleString()} {allocation.material.unit}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Used: {allocation.used_qty.toLocaleString()} {allocation.material.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {allocation.project_name || allocation.crew_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {allocation.project_name ? 'Project' : 'Crew'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[allocation.status as keyof typeof statusColors]}>
                          {statusLabels[allocation.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (allocation.used_qty / allocation.allocated_qty) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {allocation.allocated_qty > 0
                            ? Math.round((allocation.used_qty / allocation.allocated_qty) * 100)
                            : 0}% used
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">€{allocation.total_value.toLocaleString()}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{allocation.allocated_by_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/materials/allocations/${allocation.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No allocations found</h3>
              <p className="text-muted-foreground">
                No material allocations match your current filters.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/dashboard/materials/allocations/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Allocation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}