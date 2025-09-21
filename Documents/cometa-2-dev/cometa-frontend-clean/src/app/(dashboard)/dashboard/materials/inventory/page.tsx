"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Plus,
  Minus,
  Filter,
  Download,
  RefreshCw,
  Warehouse,
  BarChart3,
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useMaterials } from "@/hooks/use-materials";

const stockAdjustmentSchema = z.object({
  quantity: z.coerce.number().refine((val) => val !== 0, {
    message: "Adjustment quantity cannot be zero",
  }),
  reason: z.string().min(1, "Reason is required"),
});

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

export default function InventoryManagementPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    search: "",
  });
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);

  const { data: materialsData, isLoading } = useMaterials({
    search: filters.search,
    category: filters.category,
    per_page: 1000,
  });

  // For now, we'll calculate low stock materials client-side
  // const { data: lowStockMaterials } = useLowStockMaterials();

  // Create a simple stock adjustment handler
  const adjustStock = {
    mutateAsync: async ({ id, data }: { id: string; data: { quantity: number; reason: string } }) => {
      const response = await fetch(`/api/materials/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to adjust stock');
      }

      return response.json();
    },
    isPending: false,
  };

  const form = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      quantity: 0,
      reason: "",
    },
  });

  const materials = materialsData?.items || [];

  // Filter materials based on stock status
  const getFilteredMaterials = () => {
    let filtered = materials;

    if (filters.status === "low") {
      filtered = materials.filter(m => {
        const available = m.current_stock_qty - m.reserved_qty;
        return available <= m.min_stock_level && m.min_stock_level > 0;
      });
    } else if (filters.status === "out") {
      filtered = materials.filter(m => {
        const available = m.current_stock_qty - m.reserved_qty;
        return available <= 0;
      });
    } else if (filters.status === "normal") {
      filtered = materials.filter(m => {
        const available = m.current_stock_qty - m.reserved_qty;
        return available > m.min_stock_level || m.min_stock_level === 0;
      });
    }

    return filtered;
  };

  const filteredMaterials = getFilteredMaterials();

  // Calculate inventory statistics
  const stats = materials.reduce(
    (acc, material) => {
      const available = material.current_stock_qty - material.reserved_qty;
      const totalValue = material.current_stock_qty * material.default_price_eur;

      acc.totalValue += totalValue;
      acc.totalItems += 1;

      if (available <= 0) {
        acc.outOfStock += 1;
      } else if (available <= material.min_stock_level && material.min_stock_level > 0) {
        acc.lowStock += 1;
      } else {
        acc.inStock += 1;
      }

      return acc;
    },
    {
      totalValue: 0,
      totalItems: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
    }
  );

  const handleStockAdjustment = async (data: StockAdjustmentFormData) => {
    if (!selectedMaterial) return;

    try {
      await adjustStock.mutateAsync({
        id: selectedMaterial.id,
        data: {
          quantity: data.quantity,
          reason: data.reason,
        },
      });

      setAdjustmentDialogOpen(false);
      setSelectedMaterial(null);
      form.reset();
    } catch (error) {
      console.error("Failed to adjust stock:", error);
    }
  };

  const getStockStatus = (material: any) => {
    const available = material.current_stock_qty - material.reserved_qty;

    if (available <= 0) {
      return { status: "out", label: "Out of Stock", color: "bg-red-100 text-red-800 border-red-200" };
    } else if (available <= material.min_stock_level && material.min_stock_level > 0) {
      return { status: "low", label: "Low Stock", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    } else {
      return { status: "normal", label: "In Stock", color: "bg-green-100 text-green-800 border-green-200" };
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Monitor stock levels, manage inventory, and track material movements
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold">€{stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalItems} materials
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Normal levels
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Needs attention
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Immediate action needed
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
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
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search materials..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="Cables">Cables</SelectItem>
                  <SelectItem value="Connectors">Connectors</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Conduits">Conduits</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Stock Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="normal">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ category: "", status: "", search: "" })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
          <CardDescription>
            {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Min Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Unit Value</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => {
                    const available = material.current_stock_qty - material.reserved_qty;
                    const stockStatus = getStockStatus(material);
                    const totalValue = material.current_stock_qty * material.default_price_eur;

                    return (
                      <TableRow key={material.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-sm text-muted-foreground">{material.sku || 'No SKU'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{material.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {material.current_stock_qty.toLocaleString()} {material.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-orange-600">
                            {material.reserved_qty.toLocaleString()} {material.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={available <= 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                            {available.toLocaleString()} {material.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          {material.min_stock_level > 0 ? (
                            <span>{material.min_stock_level.toLocaleString()} {material.unit}</span>
                          ) : (
                            <span className="text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span>€{material.default_price_eur.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">€{totalValue.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {material.last_updated ? format(new Date(material.last_updated), 'MMM dd') : 'Never'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog open={adjustmentDialogOpen && selectedMaterial?.id === material.id} onOpenChange={setAdjustmentDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedMaterial(material)}
                              >
                                Adjust
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Stock Level</DialogTitle>
                                <DialogDescription>
                                  Adjust the stock level for {material.name}
                                </DialogDescription>
                              </DialogHeader>

                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleStockAdjustment)} className="space-y-4">
                                  <div className="rounded-lg border p-4 bg-muted/50">
                                    <h4 className="font-medium mb-2">Current Stock Information</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Total Stock:</span>
                                        <span className="ml-2 font-medium">{material.current_stock_qty} {material.unit}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Reserved:</span>
                                        <span className="ml-2 font-medium">{material.reserved_qty} {material.unit}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Available:</span>
                                        <span className="ml-2 font-medium">{available} {material.unit}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Adjustment Quantity</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            step="0.001"
                                            placeholder="Enter positive or negative value"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="reason"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Reason</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Reason for stock adjustment..."
                                            rows={3}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setAdjustmentDialogOpen(false);
                                        setSelectedMaterial(null);
                                        form.reset();
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={adjustStock.isPending}
                                    >
                                      {adjustStock.isPending ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                                      ) : null}
                                      Adjust Stock
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No materials found</h3>
              <p className="text-muted-foreground">
                No materials match your current filters.
              </p>
              <Button
                className="mt-4"
                onClick={() => setFilters({ category: "", status: "", search: "" })}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}