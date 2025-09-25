"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Package,
  TrendingDown,
  AlertTriangle,
  Truck,
  ClipboardList,
  DollarSign,
  Building2,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  TrendingUp,
  Users,
  MapPin,
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

import {
  useMaterials,
  useLowStockMaterials,
  useSuppliers,
  useAllocations,
  useDeleteMaterial,
  useAdjustStock,
} from "@/hooks/use-materials";
import { useMaterialOrders } from "@/hooks/use-material-orders";
import { usePermissions } from "@/hooks/use-auth";
import type { MaterialFilters, Material, MaterialUnit } from "@/types";

export default function MaterialsPage() {
  const router = useRouter();
  const { canManageInventory } = usePermissions();
  const deleteMaterial = useDeleteMaterial();
  const adjustStock = useAdjustStock();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "normal">("all");

  const filters: MaterialFilters = {
    search: searchQuery || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    low_stock: stockFilter === "low" ? true : undefined,
    page: 1,
    per_page: 20,
  };

  const { data: materialsResponse, isLoading: materialsLoading, error: materialsError } = useMaterials(filters);
  const { data: lowStockMaterials } = useLowStockMaterials();
  const { data: suppliers } = useSuppliers();
  const { data: allocationsResponse } = useAllocations({ page: 1, per_page: 10 });
  const { data: ordersResponse } = useMaterialOrders({ page: 1, per_page: 10 });

  const materials = materialsResponse?.items || [];
  const allocations = allocationsResponse?.items || [];
  const orders = ordersResponse?.items || [];

  const handleDeleteMaterial = async (materialId: string, materialName: string) => {
    if (confirm(`Are you sure you want to delete "${materialName}"? This action cannot be undone.`)) {
      await deleteMaterial.mutateAsync(materialId);
    }
  };

  const handleStockAdjustment = async (materialId: string, quantity: number, reason: string) => {
    try {
      await adjustStock.mutateAsync({ id: materialId, adjustment: { quantity, reason } });
    } catch (error) {
      console.error("Failed to adjust stock:", error);
    }
  };

  const getStockBadgeVariant = (material: Material) => {
    if (material.current_stock_qty <= material.min_stock_level) return "destructive";
    if (material.current_stock_qty <= material.min_stock_level * 1.2) return "outline";
    return "secondary";
  };

  const getStockStatus = (material: Material) => {
    if (material.current_stock_qty <= material.min_stock_level) return "Low Stock";
    if (material.current_stock_qty <= material.min_stock_level * 1.2) return "Warning";
    return "Normal";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatUnit = (unit: MaterialUnit) => {
    const unitLabels: Record<MaterialUnit, string> = {
      piece: "pcs",
      meter: "m",
      kg: "kg",
      ton: "t",
      liter: "L",
      m3: "m³",
      box: "box",
      pallet: "plt",
      roll: "roll",
    };
    return unitLabels[unit] || unit;
  };

  if (materialsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Materials</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Failed to load materials. Please try again later.
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
          <h1 className="text-3xl font-bold tracking-tight">Materials & Inventory</h1>
          <p className="text-muted-foreground">
            Manage materials, track inventory, and monitor stock levels
          </p>
        </div>
        {canManageInventory && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/materials/suppliers")}>
              <Building2 className="mr-2 h-4 w-4" />
              Suppliers
            </Button>
            <Button onClick={() => router.push("/dashboard/materials/order")}>
              <Plus className="mr-2 h-4 w-4" />
              Order Materials
            </Button>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materialsResponse?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              In inventory system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockMaterials?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need reordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => ["pending", "ordered"].includes(order.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                materials.reduce((sum, material) =>
                  sum + (material.current_stock_qty * material.unit_cost), 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total stock value
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory ({materials.length})</TabsTrigger>
          <TabsTrigger value="low-stock">
            Low Stock ({lowStockMaterials?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="allocations">Allocations ({allocations.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Materials</CardTitle>
              <CardDescription>
                Search and filter materials by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search materials by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="cables">Cables</SelectItem>
                    <SelectItem value="conduits">Conduits</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="consumables">Consumables</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={(value: "all" | "low" | "normal") => setStockFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="normal">Normal Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Materials Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Materials Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {materialsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                      <div className="h-4 bg-muted animate-pulse rounded w-20" />
                      <div className="h-4 bg-muted animate-pulse rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No materials found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery || categoryFilter !== "all" || stockFilter !== "all"
                      ? "No materials match your current filters."
                      : "Get started by adding your first material."}
                  </p>
                  {canManageInventory && (
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/dashboard/materials/new")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Material
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{material.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {material.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{material.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {material.current_stock_qty} {formatUnit(material.unit)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Min: {material.min_stock_level} {formatUnit(material.unit)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono">
                            {formatCurrency(material.unit_cost)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-medium">
                            {formatCurrency(material.current_stock_qty * material.unit_cost)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {material.supplier?.name || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStockBadgeVariant(material)}>
                            {getStockStatus(material)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/materials/${material.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {canManageInventory && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/materials/${material.id}`)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Material
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/materials/${material.id}/adjust`)}
                                  >
                                    <ArrowUpDown className="mr-2 h-4 w-4" />
                                    Adjust Stock
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteMaterial(material.id, material.name)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Material
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

        <TabsContent value="low-stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>
                Materials that need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockMaterials?.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-sm font-semibold">All stock levels are healthy</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No materials are currently below minimum stock levels.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockMaterials?.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{material.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: {material.current_stock_qty} {formatUnit(material.unit)} /
                          Min: {material.min_stock_level} {formatUnit(material.unit)}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/materials/order?material=${material.id}`)}
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Order
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/materials/${material.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-6">
          {/* Allocation Statistics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allocations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active material assignments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects with Materials</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(allocations.map(a => a.project?.id).filter(Boolean)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Allocated Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    allocations.reduce((sum, allocation) =>
                      sum + (allocation.allocated_qty * (allocation.material?.unit_cost || 0)), 0
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total allocation value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allocations.length > 0 ? Math.round(
                    (allocations.reduce((sum, a) => sum + (a.used_qty || 0), 0) /
                     allocations.reduce((sum, a) => sum + a.allocated_qty, 0)) * 100
                  ) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Materials actually used
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Allocation Analytics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Allocation by Material Type</CardTitle>
              </CardHeader>
              <CardContent>
                <AllocationChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Allocation Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectAllocationChart />
              </CardContent>
            </Card>
          </div>

          {/* Allocations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Material Allocations
              </CardTitle>
              <CardDescription>
                Track material assignments to projects and teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allocations.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No allocations found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start allocating materials to projects to track usage.
                  </p>
                  {canManageInventory && (
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/dashboard/materials/allocate")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Allocation
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((allocation) => {
                      const remaining = allocation.allocated_qty - (allocation.used_qty || 0);
                      const utilizationPercentage = (allocation.used_qty || 0) / allocation.allocated_qty * 100;
                      return (
                        <TableRow key={allocation.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{allocation.material?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {allocation.material?.category}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{allocation.project?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {allocation.project?.location}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {allocation.allocated_qty} {formatUnit(allocation.material?.unit || 'piece')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {allocation.used_qty || 0} {formatUnit(allocation.material?.unit || 'piece')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round(utilizationPercentage)}% used
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {remaining} {formatUnit(allocation.material?.unit || 'piece')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono">
                              {formatCurrency(allocation.allocated_qty * (allocation.material?.unit_cost || 0))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={utilizationPercentage > 90 ? "default" : utilizationPercentage > 50 ? "secondary" : "outline"}>
                              {utilizationPercentage > 90 ? "High Usage" : utilizationPercentage > 50 ? "In Use" : "Available"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/materials/allocations/${allocation.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {canManageInventory && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/materials/allocations/${allocation.id}/edit`)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Allocation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/materials/allocations/${allocation.id}/usage`)}
                                    >
                                      <ArrowUpDown className="mr-2 h-4 w-4" />
                                      Update Usage
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {/* Order Statistics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">
                  All purchase orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {orders.filter(order => ["pending", "ordered"].includes(order.status)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting delivery
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {orders.filter(order => order.status === "delivered").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    orders.reduce((sum, order) =>
                      sum + (order.quantity * (order.unit_price || 0)), 0
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total purchasing value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Analytics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Order Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTrendsChart />
              </CardContent>
            </Card>
          </div>

          {/* Orders Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Material Orders
              </CardTitle>
              <CardDescription>
                Manage purchase orders and deliveries from suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search orders..."
                    className="w-64"
                  />
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                {canManageInventory && (
                  <Button onClick={() => router.push("/dashboard/materials/order/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Order
                  </Button>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No orders found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start by creating your first material order.
                  </p>
                  {canManageInventory && (
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/dashboard/materials/order/new")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Order
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const total = order.quantity * (order.unit_price || 0);
                      const isOverdue = order.expected_delivery_date &&
                        new Date(order.expected_delivery_date) < new Date() &&
                        order.status !== "delivered";

                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="font-mono text-sm">
                              #{order.id.slice(0, 8)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.material?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.material?.category}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.supplier?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.supplier?.contact_person}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {order.quantity} {formatUnit(order.material?.unit || 'piece')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono">
                              {formatCurrency(order.unit_price || 0)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-medium">
                              {formatCurrency(total)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                              {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : '—'}
                              {isOverdue && (
                                <div className="text-xs text-destructive">Overdue</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              order.status === "delivered" ? "default" :
                              order.status === "ordered" ? "secondary" :
                              order.status === "pending" ? "outline" : "destructive"
                            }>
                              {order.status === "delivered" ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Delivered
                                </>
                              ) : order.status === "ordered" ? (
                                <>
                                  <Clock className="mr-1 h-3 w-3" />
                                  Ordered
                                </>
                              ) : order.status === "pending" ? (
                                <>
                                  <Clock className="mr-1 h-3 w-3" />
                                  Pending
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Cancelled
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/materials/orders/${order.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {canManageInventory && order.status !== "delivered" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/materials/orders/${order.id}/edit`)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Order
                                    </DropdownMenuItem>
                                    {order.status === "pending" && (
                                      <DropdownMenuItem>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Ordered
                                      </DropdownMenuItem>
                                    )}
                                    {(order.status === "pending" || order.status === "ordered") && (
                                      <DropdownMenuItem>
                                        <Truck className="mr-2 h-4 w-4" />
                                        Mark as Delivered
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Chart Components for Materials Analytics
const AllocationChart = () => {
  const { data: allocationsResponse } = useAllocations({ page: 1, per_page: 100 });
  const allocations = allocationsResponse?.items || [];

  const chartData = allocations.reduce((acc, allocation) => {
    const category = allocation.material?.category || 'Other';
    const existing = acc.find(item => item.category === category);
    if (existing) {
      existing.value += allocation.allocated_qty * (allocation.material?.unit_cost || 0);
      existing.count += 1;
    } else {
      acc.push({
        category,
        value: allocation.allocated_qty * (allocation.material?.unit_cost || 0),
        count: 1
      });
    }
    return acc;
  }, [] as Array<{ category: string; value: number; count: number }>);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip formatter={(value: any) => [`€${value.toLocaleString()}`, 'Allocated Value']} />
        <Bar dataKey="value" fill="#3b82f6" name="Allocated Value" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const ProjectAllocationChart = () => {
  const { data: allocationsResponse } = useAllocations({ page: 1, per_page: 100 });
  const allocations = allocationsResponse?.items || [];

  const chartData = allocations.reduce((acc, allocation) => {
    const project = allocation.project?.name || 'Unassigned';
    const existing = acc.find(item => item.project === project);
    if (existing) {
      existing.value += allocation.allocated_qty * (allocation.material?.unit_cost || 0);
    } else {
      acc.push({
        project: project.length > 20 ? project.substring(0, 20) + '...' : project,
        value: allocation.allocated_qty * (allocation.material?.unit_cost || 0)
      });
    }
    return acc;
  }, [] as Array<{ project: string; value: number }>);

  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ project, percent }) => `${project} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => [`€${value.toLocaleString()}`, 'Allocated Value']} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const OrderStatusChart = () => {
  const { data: ordersResponse } = useMaterialOrders({ page: 1, per_page: 100 });
  const orders = ordersResponse?.items || [];

  const statusData = orders.reduce((acc, order) => {
    const status = order.status || 'pending';
    const existing = acc.find(item => item.status === status);
    if (existing) {
      existing.count += 1;
      existing.value += order.quantity * (order.unit_price || 0);
    } else {
      acc.push({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: 1,
        value: order.quantity * (order.unit_price || 0)
      });
    }
    return acc;
  }, [] as Array<{ status: string; count: number; value: number }>);

  const COLORS = {
    'Pending': '#f59e0b',
    'Ordered': '#3b82f6',
    'Delivered': '#22c55e',
    'Cancelled': '#ef4444'
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ status, count }) => `${status} (${count})`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || '#8b5cf6'} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any, name: any) => [value, 'Orders']} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const OrderTrendsChart = () => {
  const { data: ordersResponse } = useMaterialOrders({ page: 1, per_page: 100 });
  const orders = ordersResponse?.items || [];

  // Group orders by month for the last 6 months
  const monthsData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      orders: 0,
      value: 0
    };
  }).reverse();

  orders.forEach(order => {
    if (order.created_at) {
      const orderDate = new Date(order.created_at);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const monthData = monthsData.find(m => m.monthKey === monthKey);
      if (monthData) {
        monthData.orders += 1;
        monthData.value += order.quantity * (order.unit_price || 0);
      }
    }
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={monthsData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value: any, name: any) => [
            name === 'orders' ? value : `€${value.toLocaleString()}`,
            name === 'orders' ? 'Orders' : 'Value'
          ]}
        />
        <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="orders" />
        <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} name="value" />
      </LineChart>
    </ResponsiveContainer>
  );
};