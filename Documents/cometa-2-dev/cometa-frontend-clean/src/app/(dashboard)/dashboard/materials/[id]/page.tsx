"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  DollarSign,
  Plus,
  Minus,
  Save,
  X,
  History,
  Truck,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useMaterial, useUpdateMaterial, useDeleteMaterial } from "@/hooks/use-materials";
import { toast } from "sonner";

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    unit: "",
    sku: "",
    default_price_eur: 0,
    purchase_price_eur: 0,
    min_stock_level: 0,
  });

  const { data: material, isLoading, error } = useMaterial(materialId);
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  // Initialize form when material data loads
  React.useEffect(() => {
    if (material && !isEditing) {
      setEditForm({
        name: material.name || "",
        description: material.description || "",
        unit: material.unit || "",
        sku: material.sku || "",
        default_price_eur: material.default_price_eur || 0,
        purchase_price_eur: material.purchase_price_eur || 0,
        min_stock_level: material.min_stock_level || 0,
      });
    }
  }, [material, isEditing]);

  const handleEdit = () => {
    if (material) {
      setEditForm({
        name: material.name || "",
        description: material.description || "",
        unit: material.unit || "",
        sku: material.sku || "",
        default_price_eur: material.default_price_eur || 0,
        purchase_price_eur: material.purchase_price_eur || 0,
        min_stock_level: material.min_stock_level || 0,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateMaterial.mutateAsync({
        id: materialId,
        data: editForm,
      });
      setIsEditing(false);
      toast.success("Material updated successfully");
    } catch (error) {
      toast.error("Failed to update material");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (material) {
      setEditForm({
        name: material.name || "",
        description: material.description || "",
        unit: material.unit || "",
        sku: material.sku || "",
        default_price_eur: material.default_price_eur || 0,
        purchase_price_eur: material.purchase_price_eur || 0,
        min_stock_level: material.min_stock_level || 0,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMaterial.mutateAsync(materialId);
      toast.success("Material deleted successfully");
      router.push("/dashboard/materials");
    } catch (error) {
      toast.error("Failed to delete material");
    }
  };

  const getStockStatus = () => {
    if (!material) return { status: "unknown", color: "gray" };

    const { available_qty, min_stock_level } = material;

    if (available_qty <= 0) {
      return { status: "Out of Stock", color: "red" };
    } else if (available_qty <= min_stock_level) {
      return { status: "Low Stock", color: "yellow" };
    } else {
      return { status: "In Stock", color: "green" };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Material Not Found</h2>
          <p className="text-gray-600 mb-4">The material you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/materials")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Materials
          </Button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/materials")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? (
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="text-2xl font-bold"
                />
              ) : (
                material.name
              )}
            </h1>
            <p className="text-gray-600">Material Details</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMaterial.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {material.current_stock_qty} {material.unit}
            </div>
            <Badge
              variant={stockStatus.color === "green" ? "default" : stockStatus.color === "yellow" ? "secondary" : "destructive"}
            >
              {stockStatus.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {material.available_qty} {material.unit}
            </div>
            <p className="text-xs text-muted-foreground">
              {material.reserved_qty} reserved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{material.default_price_eur.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Purchase: €{material.purchase_price_eur.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Category</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{material.category}</div>
            <p className="text-xs text-muted-foreground">
              SKU: {material.sku || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Information</CardTitle>
              <CardDescription>
                Basic information about this material
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{material.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  {isEditing ? (
                    <Input
                      id="sku"
                      value={editForm.sku}
                      onChange={(e) =>
                        setEditForm({ ...editForm, sku: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{material.sku || "N/A"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.unit}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="liter">Liter</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="roll">Roll</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-900">{material.unit}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <p className="text-sm text-gray-900">{material.category}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_price">Default Price (EUR)</Label>
                  {isEditing ? (
                    <Input
                      id="default_price"
                      type="number"
                      step="0.01"
                      value={editForm.default_price_eur}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          default_price_eur: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      €{material.default_price_eur.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase Price (EUR)</Label>
                  {isEditing ? (
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={editForm.purchase_price_eur}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          purchase_price_eur: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      €{material.purchase_price_eur.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stock">Minimum Stock Level</Label>
                  {isEditing ? (
                    <Input
                      id="min_stock"
                      type="number"
                      value={editForm.min_stock_level}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          min_stock_level: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {material.min_stock_level} {material.unit}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage">Storage Location</Label>
                  <p className="text-sm text-gray-900">
                    {material.storage_location || "Main Warehouse"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-900">
                    {material.description || "No description available"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>
                Recent stock movements for this material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Stock movement history will be implemented with inventory tracking
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Allocations</CardTitle>
              <CardDescription>
                Materials currently allocated to projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Material allocations will be loaded from the database
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{material.name}"? This action cannot be undone.
              This will also remove all associated warehouse entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMaterial.isPending}
            >
              {deleteMaterial.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}