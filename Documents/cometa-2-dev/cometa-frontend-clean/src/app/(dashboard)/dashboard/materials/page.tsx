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
  useMaterials,
  useLowStockMaterials,
  useSuppliers,
  useAllocations,
  useOrders,
  useDeleteMaterial,
  useAdjustStock,
} from "@/hooks/use-materials";
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
  const { data: ordersResponse } = useOrders({ page: 1, per_page: 10 });

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
            <Button onClick={() => router.push("/dashboard/materials/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Material
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
                                    onClick={() => router.push(`/dashboard/materials/${material.id}/edit`)}
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
              <div className="text-center py-8 text-muted-foreground">
                Material allocations view will be implemented with detailed allocation tracking.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Material Orders
              </CardTitle>
              <CardDescription>
                Manage purchase orders and deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Material orders management will be implemented with order tracking and supplier integration.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}