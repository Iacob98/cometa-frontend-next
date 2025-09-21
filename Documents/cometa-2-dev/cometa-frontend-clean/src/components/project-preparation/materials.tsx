'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Package, ShoppingCart, Calendar, Euro, Truck, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { useProjectMaterials, useWarehouseMaterials, useAssignMaterialToProject, useUpdateMaterialAssignment, useDeleteMaterialAssignment, useCreateMaterial, ProjectMaterial } from '@/hooks/use-materials';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface MaterialsProps {
  projectId: string;
}

interface MaterialAssignmentForm {
  material_id: string;
  quantity: number;
  from_date: string;
  to_date?: string;
  notes?: string;
}

interface EditMaterialForm {
  quantity: number;
  unit_price: number;
  from_date: string;
  to_date?: string;
  notes?: string;
}

interface CreateMaterialForm {
  name: string;
  sku?: string;
  unit: string;
  description?: string;
  default_price_eur: number;
  purchase_price_eur: number;
  initial_stock: number;
  min_stock_level: number;
}

const STATUS_CONFIG = {
  allocated: { label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
  used: { label: 'Used', color: 'bg-green-100 text-green-800' },
  returned: { label: 'Returned', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function Materials({ projectId }: MaterialsProps) {
  const [activeTab, setActiveTab] = useState('assigned');
  const [editingMaterial, setEditingMaterial] = useState<ProjectMaterial | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: projectMaterials, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProjectMaterials(projectId);
  const { data: warehouseMaterials, isLoading: warehouseLoading, error: warehouseError } = useWarehouseMaterials();
  const assignMaterial = useAssignMaterialToProject();
  const updateMaterial = useUpdateMaterialAssignment();
  const deleteMaterial = useDeleteMaterialAssignment();
  const createMaterial = useCreateMaterial();

  const assignForm = useForm<MaterialAssignmentForm>();
  const editForm = useForm<EditMaterialForm>();
  const createForm = useForm<CreateMaterialForm>();

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (projectError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Materials</h3>
            <p className="text-gray-600 mb-4">{projectError.message}</p>
            <Button onClick={() => refetchProject()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAssignMaterial = async (data: MaterialAssignmentForm) => {
    try {
      await assignMaterial.mutateAsync({
        ...data,
        project_id: projectId,
      });
      assignForm.reset();
      refetchProject();
      toast.success('Material assigned successfully');
    } catch (error) {
      toast.error('Failed to assign material');
    }
  };

  const handleUpdateMaterial = async (data: EditMaterialForm) => {
    if (!editingMaterial) return;

    try {
      await updateMaterial.mutateAsync({
        assignment_id: editingMaterial.id,
        ...data,
      });
      editForm.reset();
      setEditingMaterial(null);
      setShowEditDialog(false);
      refetchProject();
      toast.success('Material assignment updated successfully');
    } catch (error) {
      toast.error('Failed to update material assignment');
    }
  };

  const handleEditMaterial = (material: ProjectMaterial) => {
    setEditingMaterial(material);
    editForm.setValue('quantity', material.allocated_qty);
    editForm.setValue('unit_price', material.unit_price);
    editForm.setValue('from_date', material.allocation_date);
    editForm.setValue('to_date', material.return_date || '');
    editForm.setValue('notes', material.notes || '');
    setShowEditDialog(true);
  };

  const handleCancelEdit = () => {
    setEditingMaterial(null);
    setShowEditDialog(false);
    editForm.reset();
  };

  const handleCreateMaterial = async (data: CreateMaterialForm) => {
    try {
      await createMaterial.mutateAsync(data);
      createForm.reset();
      setActiveTab('assigned');
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleDeleteMaterial = async (assignmentId: string) => {
    if (window.confirm('Are you sure you want to delete this material assignment?')) {
      try {
        await deleteMaterial.mutateAsync(assignmentId);
        refetchProject();
        toast.success('Material assignment deleted successfully');
      } catch (error) {
        toast.error('Failed to delete material assignment');
      }
    }
  };

  const totalMaterials = projectMaterials?.materials?.length || 0;
  const pendingCount = projectMaterials?.materials?.filter(m => m.status === 'allocated')?.length || 0;
  const usedCount = projectMaterials?.materials?.filter(m => m.status === 'used')?.length || 0;
  const totalCost = projectMaterials?.materials?.reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Materials Management</h3>
          <p className="text-gray-600">Material allocation and ordering for projects</p>
        </div>
      </div>

      {/* Materials Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Materials</p>
                <p className="text-2xl font-bold">{totalMaterials}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Used</p>
                <p className="text-2xl font-bold">{usedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Total Cost</p>
                <p className="text-2xl font-bold">€{totalCost.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assigned">Assigned Materials</TabsTrigger>
          <TabsTrigger value="assign">Assign Materials</TabsTrigger>
          <TabsTrigger value="create">Create Material</TabsTrigger>
        </TabsList>

        {/* Assigned Materials Tab */}
        <TabsContent value="assigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Materials</CardTitle>
              <CardDescription>
                Materials currently assigned to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalMaterials > 0 ? (
                <div className="space-y-4">
                  {projectMaterials?.materials?.map((material) => (
                    <Card key={material.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={STATUS_CONFIG[material.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-800'}>
                                {STATUS_CONFIG[material.status as keyof typeof STATUS_CONFIG]?.label || material.status}
                              </Badge>
                              <Badge variant="outline">{material.sku || 'No SKU'}</Badge>
                            </div>
                            <h5 className="font-semibold">{material.name}</h5>
                            <p className="text-sm text-gray-600">
                              Quantity: {material.allocated_qty} {material.unit}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {material.allocation_date}
                                {material.return_date && ` - ${material.return_date}`}
                              </span>
                              <span className="flex items-center">
                                <Euro className="w-4 h-4 mr-1" />
                                €{material.unit_price}/unit
                              </span>
                            </div>
                            {material.notes && (
                              <p className="text-sm text-gray-500 mt-1">Note: {material.notes}</p>
                            )}
                            {material.allocated_by_name && (
                              <p className="text-sm text-gray-500">Assigned by: {material.allocated_by_name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">€{material.total_cost?.toFixed(2) || '0.00'}</p>
                            <div className="flex space-x-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditMaterial(material)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteMaterial(material.id)}
                                disabled={deleteMaterial.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Materials Assigned</h3>
                  <p className="text-gray-600 mb-4">
                    Assign materials to start tracking inventory for this project.
                  </p>
                  <Button onClick={() => setActiveTab('assign')}>
                    <Package className="w-4 h-4 mr-2" />
                    Assign Materials
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assign Materials Tab */}
        <TabsContent value="assign">
          <Card>
            <CardHeader>
              <CardTitle>Assign Materials to Project</CardTitle>
              <CardDescription>
                Select materials from warehouse inventory to assign to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {warehouseLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-32" />
                </div>
              ) : warehouseError ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                  <p className="text-red-600">Failed to load warehouse materials</p>
                </div>
              ) : warehouseMaterials && warehouseMaterials.length > 0 ? (
                <form onSubmit={assignForm.handleSubmit(handleAssignMaterial)} className="space-y-4">
                  <div>
                    <Label htmlFor="material_id">Select Material</Label>
                    <Select onValueChange={(value) => assignForm.setValue('material_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material from warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouseMaterials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{material.name}</span>
                              <span className="text-sm text-gray-500">
                                Available: {material.available_qty} {material.unit} | €{material.price}/unit
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {assignForm.watch('material_id') && (
                    <>
                      {(() => {
                        const selectedMaterial = warehouseMaterials.find(m => m.id === assignForm.watch('material_id'));
                        if (!selectedMaterial) return null;

                        return (
                          <div className="p-4 border rounded-lg bg-gray-50">
                            <h4 className="font-semibold mb-2">Material Details</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Current Stock</p>
                                <p className={`${selectedMaterial.available_qty > selectedMaterial.min_stock ? 'text-green-600' : 'text-orange-600'}`}>
                                  {selectedMaterial.available_qty} {selectedMaterial.unit}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">Unit Price</p>
                                <p>€{selectedMaterial.price}</p>
                              </div>
                              <div>
                                <p className="font-medium">Description</p>
                                <p className="text-gray-600">{selectedMaterial.description || 'No description'}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max={warehouseMaterials.find(m => m.id === assignForm.watch('material_id'))?.available_qty}
                            placeholder="Enter quantity"
                            {...assignForm.register('quantity', { required: true, valueAsNumber: true })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="from_date">Start Date</Label>
                          <Input
                            type="date"
                            {...assignForm.register('from_date', { required: true })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="to_date">End Date (Optional)</Label>
                          <Input
                            type="date"
                            {...assignForm.register('to_date')}
                          />
                        </div>
                        <div>
                          {assignForm.watch('quantity') && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium">Estimated Cost</p>
                              <p className="text-lg font-bold text-blue-600">
                                €{(
                                  (assignForm.watch('quantity') || 0) *
                                  (warehouseMaterials.find(m => m.id === assignForm.watch('material_id'))?.price || 0)
                                ).toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          placeholder="Special conditions or requirements..."
                          {...assignForm.register('notes')}
                        />
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={assignMaterial.isPending || !assignForm.watch('material_id') || !assignForm.watch('quantity')}
                  >
                    {assignMaterial.isPending ? 'Assigning...' : 'Assign Material'}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-orange-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Available Materials</h3>
                  <p className="text-gray-600 mb-4">
                    No materials are currently available in the warehouse.
                  </p>
                  <Button variant="outline">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add Materials to Warehouse
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Material Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Material</CardTitle>
              <CardDescription>
                Add a new material to the warehouse inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createForm.handleSubmit(handleCreateMaterial)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-name">Material Name *</Label>
                    <Input
                      id="create-name"
                      type="text"
                      placeholder="Enter material name"
                      {...createForm.register('name', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-sku">SKU (Optional)</Label>
                    <Input
                      id="create-sku"
                      type="text"
                      placeholder="Enter SKU code"
                      {...createForm.register('sku')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-unit">Unit *</Label>
                    <Select onValueChange={(value) => createForm.setValue('unit', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                        <SelectItem value="kilogram">Kilogram</SelectItem>
                        <SelectItem value="liter">Liter</SelectItem>
                        <SelectItem value="ton">Ton</SelectItem>
                        <SelectItem value="m3">Cubic Meter</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="pallet">Pallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-default-price">Default Price (€) *</Label>
                    <Input
                      id="create-default-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter default price"
                      {...createForm.register('default_price_eur', { required: true, valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-purchase-price">Purchase Price (€) *</Label>
                    <Input
                      id="create-purchase-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter purchase price"
                      {...createForm.register('purchase_price_eur', { required: true, valueAsNumber: true })}
                    />
                  </div>
                  <div></div>
                </div>

                <div>
                  <Label htmlFor="create-description">Description (Optional)</Label>
                  <Textarea
                    id="create-description"
                    placeholder="Enter material description..."
                    {...createForm.register('description')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-initial-stock">Initial Stock *</Label>
                    <Input
                      id="create-initial-stock"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Enter initial stock quantity"
                      {...createForm.register('initial_stock', { required: true, valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-min-stock">Minimum Stock *</Label>
                    <Input
                      id="create-min-stock"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Enter minimum stock level"
                      {...createForm.register('min_stock_level', { required: true, valueAsNumber: true })}
                    />
                  </div>
                </div>

                {createForm.watch('initial_stock') && createForm.watch('default_price_eur') && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Stock Value Summary</h4>
                    <div className="text-sm space-y-1">
                      <p>Initial Stock: {createForm.watch('initial_stock')} {createForm.watch('unit') || 'units'}</p>
                      <p>Default Price: €{createForm.watch('default_price_eur')}</p>
                      <p>Purchase Price: €{createForm.watch('purchase_price_eur') || 0}</p>
                      <p className="font-semibold text-green-700">
                        Total Value: €{((createForm.watch('initial_stock') || 0) * (createForm.watch('default_price_eur') || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMaterial.isPending || !createForm.watch('name') || !createForm.watch('unit') || !createForm.watch('default_price_eur') || !createForm.watch('purchase_price_eur') || !createForm.watch('initial_stock') || !createForm.watch('min_stock_level')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createMaterial.isPending ? 'Creating...' : 'Create Material'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      createForm.reset();
                      setActiveTab('assigned');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Material Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Material Assignment</DialogTitle>
            <DialogDescription>
              Update material assignment details
            </DialogDescription>
          </DialogHeader>

          {editingMaterial && (
            <form onSubmit={editForm.handleSubmit(handleUpdateMaterial)} className="space-y-4">
              {/* Material Info Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{editingMaterial.name}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>SKU: {editingMaterial.sku || 'No SKU'}</p>
                  <p>Unit: {editingMaterial.unit}</p>
                  <p>Status: {STATUS_CONFIG[editingMaterial.status as keyof typeof STATUS_CONFIG]?.label || editingMaterial.status}</p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    step="0.1"
                    placeholder="Enter quantity"
                    {...editForm.register('quantity', { required: true, valueAsNumber: true })}
                  />
                  <p className="text-sm text-gray-500 mt-1">Unit: {editingMaterial.unit}</p>
                </div>

                <div>
                  <Label htmlFor="edit-unit-price">Unit Price (€)</Label>
                  <Input
                    id="edit-unit-price"
                    type="number"
                    step="0.01"
                    placeholder="Enter unit price"
                    {...editForm.register('unit_price', { required: true, valueAsNumber: true })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-from-date">Start Date</Label>
                    <Input
                      id="edit-from-date"
                      type="date"
                      {...editForm.register('from_date', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-to-date">End Date</Label>
                    <Input
                      id="edit-to-date"
                      type="date"
                      {...editForm.register('to_date')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Additional notes..."
                    {...editForm.register('notes')}
                  />
                </div>

                {editForm.watch('quantity') && editForm.watch('unit_price') && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">Total Cost</p>
                    <p className="text-lg font-bold text-blue-600">
                      €{((editForm.watch('quantity') || 0) * (editForm.watch('unit_price') || 0)).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateMaterial.isPending}
                >
                  {updateMaterial.isPending ? 'Updating...' : 'Update'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}