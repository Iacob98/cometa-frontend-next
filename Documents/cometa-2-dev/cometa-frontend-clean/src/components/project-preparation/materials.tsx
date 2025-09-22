'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Package, ShoppingCart, Calendar, Euro, Truck, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Plus, MoreHorizontal, ExternalLink } from 'lucide-react';
import { useProjectMaterials, useWarehouseMaterials, useAssignMaterialToProject, useUpdateMaterialAssignment, useDeleteMaterialAssignment, useCreateMaterial, ProjectMaterial } from '@/hooks/use-materials';
import { useMaterialOrders, useUpdateMaterialOrder } from '@/hooks/use-material-orders';
import { useMaterialOrderBudgetImpact } from '@/hooks/use-material-order-budget';
import { useProjects } from '@/hooks/use-projects';
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('assigned');
  const [editingMaterial, setEditingMaterial] = useState<ProjectMaterial | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: projectMaterials, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProjectMaterials(projectId);
  const { data: warehouseMaterials, isLoading: warehouseLoading, error: warehouseError } = useWarehouseMaterials();
  const { data: materialOrdersResponse } = useMaterialOrders({ project_id: projectId });
  const { data: projectsResponse } = useProjects();
  const materialOrders = materialOrdersResponse?.items || [];
  const project = projectsResponse?.items?.find(p => p.id === projectId);
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
          <TabsTrigger value="order">Order Materials</TabsTrigger>
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

        {/* Order Materials Tab */}
        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Order Materials</span>
              </CardTitle>
              <CardDescription>
                Order materials from suppliers for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Quick Link to Full Order Page */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Need to place a complex order?</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Use the full materials ordering interface for multiple items and advanced options
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/materials/order?project_id=${projectId}`)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Full Order Interface
                    </Button>
                  </div>
                </div>

                {/* Recent Orders for this Project */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Orders for this Project</h3>
                  {materialOrders && materialOrders.length > 0 ? (
                    <div className="space-y-3">
                      {materialOrders.slice(0, 5).map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}

                      {materialOrders.length > 5 && (
                        <Button
                          variant="outline"
                          onClick={() => router.push('/dashboard/materials')}
                          className="w-full"
                        >
                          View All Orders ({materialOrders.length})
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No material orders for this project yet</p>
                      <Button
                        onClick={() => router.push(`/dashboard/materials/order?project_id=${projectId}`)}
                        className="mt-3"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Create First Order
                      </Button>
                    </div>
                  )}
                </div>

                {/* Order Summary Stats */}
                {materialOrders && materialOrders.length > 0 && (
                  <OrderSummaryStats orders={materialOrders} />
                )}
              </div>
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

// OrderSummaryStats component
function OrderSummaryStats({ orders }: { orders: any[] }) {
  const totalValue = orders.reduce((sum, order) => sum + order.total_cost_eur, 0);
  const pendingOrdered = orders.filter(order => order.status === 'pending' || order.status === 'ordered').length;

  return (
    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-600">
          {orders.length}
        </p>
        <p className="text-sm text-gray-600">Total Orders</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-green-600">
          €{totalValue.toFixed(0)}
        </p>
        <p className="text-sm text-gray-600">Total Value</p>
        <p className="text-xs text-green-600 mt-1">Budget Impact</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-orange-600">
          {pendingOrdered}
        </p>
        <p className="text-sm text-gray-600">Pending/Ordered</p>
      </div>
    </div>
  );
}

// OrderCard component with budget impact indicator and status management
function OrderCard({ order }: { order: any }) {
  const { data: budgetImpact } = useMaterialOrderBudgetImpact(order.id);
  const updateOrder = useUpdateMaterialOrder();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');
  const [notes, setNotes] = useState(order.notes || '');

  const handleStatusUpdate = async () => {
    try {
      const updateData: any = {
        status: newStatus,
        notes: notes || undefined,
      };

      if (newStatus === 'delivered' && actualDeliveryDate) {
        updateData.actual_delivery_date = actualDeliveryDate;
      }

      await updateOrder.mutateAsync({
        id: order.id,
        data: updateData,
      });

      setShowStatusDialog(false);
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'ordered':
        return <Truck className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="font-medium">Order #{order.id.slice(0, 8)}</h4>
            <Badge className={getStatusColor(order.status)}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </Badge>
            {budgetImpact?.has_budget_impact && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Euro className="w-3 h-3 mr-1" />
                Budget Applied
              </Badge>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Ordered: {new Date(order.order_date).toLocaleDateString()}
              </span>
              {order.expected_delivery_date && (
                <span className="flex items-center">
                  <Truck className="w-4 h-4 mr-1" />
                  Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {order.actual_delivery_date && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Delivered: {new Date(order.actual_delivery_date).toLocaleDateString()}
              </div>
            )}

            {order.supplier_name && (
              <p>Supplier: {order.supplier_name}</p>
            )}

            {order.material_type && (
              <p>Material: {order.material_type}</p>
            )}

            {budgetImpact?.has_budget_impact && (
              <p className="text-green-600">
                €{budgetImpact.amount_deducted?.toFixed(2)} deducted from project budget
              </p>
            )}

            {order.notes && (
              <p className="text-gray-500 italic">Note: {order.notes}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="font-semibold">€{order.total_cost_eur.toFixed(2)}</p>
            <p className="text-sm text-gray-600">{order.quantity} units</p>
            {order.unit_price_eur && (
              <p className="text-xs text-gray-500">€{order.unit_price_eur}/unit</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Update Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/dashboard/materials?order=${order.id}`, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status and details for Order #{order.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Order Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'delivered' && (
              <div>
                <Label htmlFor="actual_delivery_date">Actual Delivery Date</Label>
                <Input
                  id="actual_delivery_date"
                  type="date"
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this order..."
                rows={3}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handleStatusUpdate}
                disabled={updateOrder.isPending}
                className="flex-1"
              >
                {updateOrder.isPending ? 'Updating...' : 'Update Order'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}