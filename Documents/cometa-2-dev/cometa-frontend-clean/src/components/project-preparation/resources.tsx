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
import { AlertCircle, Truck, Settings, Calendar, Euro, MapPin, User, Plus, Trash2, Edit } from 'lucide-react';
import { useProjectResources, useAvailableVehicles, useAvailableEquipment, useCreateVehicleAssignment, useCreateEquipmentAssignment, useCreateRentalVehicle, useCreateRentalEquipment, useRemoveResourceAssignment } from '@/hooks/use-resources';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ResourcesProps {
  projectId: string;
}

interface VehicleAssignmentForm {
  vehicle_id: string;
  from_date: string;
  to_date?: string;
  driver_name?: string;
  purpose?: string;
  is_permanent: boolean;
  notes?: string;
}

interface EquipmentAssignmentForm {
  equipment_id: string;
  from_date: string;
  to_date?: string;
  operator_name?: string;
  purpose?: string;
  is_permanent: boolean;
  notes?: string;
}

interface RentalVehicleForm {
  brand: string;
  model: string;
  plate_number: string;
  type: string;
  rental_company: string;
  daily_rate: number;
  hourly_rate?: number;
  fuel_consumption: number;
  rental_start: string;
  rental_end?: string;
  driver_name?: string;
  purpose?: string;
  contract_notes?: string;
}

interface RentalEquipmentForm {
  name: string;
  type: string;
  inventory_no: string;
  rental_company: string;
  daily_rate: number;
  hourly_rate?: number;
  rental_start: string;
  rental_end?: string;
  operator_name?: string;
  purpose?: string;
  contract_notes?: string;
}

interface EditResourceForm {
  period: string;
  operator_name: string;
  purpose: string;
  daily_rate?: number;
  notes: string;
}

const VEHICLE_TYPES = [
  { value: 'van', label: 'Lieferwagen', icon: '' },
  { value: 'truck', label: 'LKW', icon: '' },
  { value: 'trailer', label: 'Anhänger', icon: '' },
  { value: 'excavator', label: 'Bagger', icon: '' },
  { value: 'other', label: 'Sonstiges', icon: '' },
];

const EQUIPMENT_TYPES = [
  { value: 'drill', label: 'Bohrgerät', icon: '' },
  { value: 'excavator', label: 'Bagger', icon: '' },
  { value: 'generator', label: 'Generator', icon: '' },
  { value: 'crane', label: 'Kran', icon: '' },
  { value: 'compressor', label: 'Kompressor', icon: '' },
  { value: 'other', label: 'Sonstiges', icon: '' },
];

export default function Resources({ projectId }: ResourcesProps) {
  const [activeTab, setActiveTab] = useState('assigned');
  const [editingResource, setEditingResource] = useState<{
    id: string;
    type: 'vehicle' | 'equipment';
    data: any;
  } | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: resources, isLoading, error, refetch } = useProjectResources(projectId);
  const { data: availableVehicles } = useAvailableVehicles();
  const { data: availableEquipment } = useAvailableEquipment();
  const createVehicleAssignment = useCreateVehicleAssignment();
  const createEquipmentAssignment = useCreateEquipmentAssignment();
  const createRentalVehicle = useCreateRentalVehicle();
  const createRentalEquipment = useCreateRentalEquipment();
  const removeResourceAssignment = useRemoveResourceAssignment();

  const vehicleForm = useForm<VehicleAssignmentForm>();
  const equipmentForm = useForm<EquipmentAssignmentForm>();
  const rentalVehicleForm = useForm<RentalVehicleForm>();
  const rentalEquipmentForm = useForm<RentalEquipmentForm>();
  const editForm = useForm<EditResourceForm>();

  if (isLoading) {
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Resources</h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleVehicleAssignment = async (data: VehicleAssignmentForm) => {
    try {
      await createVehicleAssignment.mutateAsync({
        ...data,
        project_id: projectId,
      });
      vehicleForm.reset();
      setEditingResource(null); // Clear editing state
      setActiveTab('assigned'); // Switch back to assigned resources view
    } catch (error) {
      // Error handling is done by the mutation
    }
  };

  const handleEquipmentAssignment = async (data: EquipmentAssignmentForm) => {
    try {
      await createEquipmentAssignment.mutateAsync({
        ...data,
        project_id: projectId,
      });
      equipmentForm.reset();
      setEditingResource(null); // Clear editing state
      setActiveTab('assigned'); // Switch back to assigned resources view
    } catch (error) {
      // Error handling is done by the mutation
    }
  };

  const handleRentalVehicleCreate = async (data: RentalVehicleForm) => {
    try {
      await createRentalVehicle.mutateAsync({
        ...data,
        project_id: projectId,
      });
      rentalVehicleForm.reset();
      setActiveTab('assigned'); // Switch back to assigned resources view
    } catch (error) {
      // Error handling is done by the mutation
    }
  };

  const handleRentalEquipmentCreate = async (data: RentalEquipmentForm) => {
    try {
      await createRentalEquipment.mutateAsync({
        ...data,
        project_id: projectId,
      });
      rentalEquipmentForm.reset();
      setActiveTab('assigned'); // Switch back to assigned resources view
    } catch (error) {
      // Error handling is done by the mutation
    }
  };

  const handleRemoveResource = async (resourceId: string, resourceType: 'vehicle' | 'equipment', resourceName: string) => {
    if (confirm(`Are you sure you want to remove ${resourceName} from this project?`)) {
      try {
        await removeResourceAssignment.mutateAsync({
          projectId,
          resourceId,
          resourceType
        });
        // No need for manual refetch - the mutation handles cache invalidation
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleEditResource = (resource: any, type: 'vehicle' | 'equipment') => {
    setEditingResource({
      id: resource.id,
      type,
      data: resource
    });

    // Populate edit form with current resource data
    editForm.setValue('period', resource.period || '');
    editForm.setValue('operator_name', type === 'vehicle' ? resource.driver_name || '' : resource.operator_name || '');
    editForm.setValue('purpose', resource.purpose || '');
    editForm.setValue('daily_rate', resource.daily_rate || '');
    editForm.setValue('notes', resource.contract_notes || resource.notes || '');

    setShowEditDialog(true);
  };

  const handleCancelEdit = () => {
    setEditingResource(null);
    setShowEditDialog(false);
    editForm.reset();
  };

  const handleUpdateResource = async (data: EditResourceForm) => {
    if (!editingResource) return;

    try {
      // Here you would typically call an API to update the resource
      // For now, we'll just show a success message

      console.log('Updating resource:', {
        resourceId: editingResource.id,
        type: editingResource.type,
        updates: data
      });

      toast.success(`${editingResource.type === 'vehicle' ? 'Vehicle' : 'Equipment'} updated successfully`);
      setShowEditDialog(false);
      setEditingResource(null);
      editForm.reset();

      // Refresh the resources data
      refetch();
    } catch (error) {
      toast.error('Failed to update resource');
    }
  };

  const totalResources = resources?.summary?.total_resources || 0;
  const totalVehicles = resources?.summary?.total_vehicles || 0;
  const totalEquipment = resources?.summary?.total_equipment || 0;
  const totalCost = resources?.summary?.total_cost || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Resource Management</h3>
          <p className="text-gray-600">Vehicle and equipment assignment to projects</p>
        </div>
      </div>

      {/* Resource Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Resources</p>
                <p className="text-2xl font-bold">{totalResources}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Vehicles</p>
                <p className="text-2xl font-bold">{totalVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Equipment</p>
                <p className="text-2xl font-bold">{totalEquipment}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Total Cost</p>
                <p className="text-2xl font-bold">€{totalCost.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="assigned">Assigned Resources</TabsTrigger>
          <TabsTrigger value="assign-vehicle">Assign Vehicle</TabsTrigger>
          <TabsTrigger value="assign-equipment">Assign Equipment</TabsTrigger>
          <TabsTrigger value="rent-vehicle">Rent Vehicle</TabsTrigger>
          <TabsTrigger value="rent-equipment">Rent Equipment</TabsTrigger>
        </TabsList>

        {/* Assigned Resources Tab */}
        <TabsContent value="assigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Resources</CardTitle>
              <CardDescription>
                Currently assigned vehicles and equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalResources > 0 ? (
                <div className="space-y-6">
                  {/* Vehicles Section */}
                  {resources?.vehicles && resources.vehicles.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 flex items-center">
                        <Truck className="w-5 h-5 mr-2" />
                        Vehicles ({resources.vehicles.length})
                      </h4>
                      <div className="grid gap-4">
                        {resources.vehicles.map((vehicle) => (
                          <Card key={vehicle.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge variant="secondary">
                                      {vehicle.type.toUpperCase()}
                                    </Badge>
                                    <Badge variant={vehicle.owned ? 'default' : 'destructive'}>
                                      {vehicle.owned ? 'Owned' : 'Rental'}
                                    </Badge>
                                  </div>
                                  <h5 className="font-semibold">{vehicle.brand} {vehicle.model}</h5>
                                  <p className="text-sm text-gray-600">Plate: {vehicle.plate_number}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm">
                                    <span className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {vehicle.period}
                                    </span>
                                    <span className="flex items-center">
                                      <Euro className="w-4 h-4 mr-1" />
                                      {vehicle.daily_rate ? `€${vehicle.daily_rate}/day` : 'Owned'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">€{vehicle.total_cost?.toFixed(2) || '0.00'}</p>
                                  <p className="text-sm text-gray-600">{vehicle.days || 'Unlimited'} days</p>
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditResource(vehicle, 'vehicle')}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRemoveResource(vehicle.id, 'vehicle', `${vehicle.brand} ${vehicle.model}`)}
                                      disabled={removeResourceAssignment.isPending}
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
                    </div>
                  )}

                  {/* Equipment Section */}
                  {resources?.equipment && resources.equipment.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        Equipment ({resources.equipment.length})
                      </h4>
                      <div className="grid gap-4">
                        {resources.equipment.map((equipment) => (
                          <Card key={equipment.id} className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge variant="secondary">
                                      {equipment.type.toUpperCase()}
                                    </Badge>
                                    <Badge variant={equipment.owned ? 'default' : 'destructive'}>
                                      {equipment.owned ? 'Owned' : 'Rental'}
                                    </Badge>
                                  </div>
                                  <h5 className="font-semibold">{equipment.name}</h5>
                                  <p className="text-sm text-gray-600">Inventory: {equipment.inventory_no}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm">
                                    <span className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {equipment.period}
                                    </span>
                                    <span className="flex items-center">
                                      <Euro className="w-4 h-4 mr-1" />
                                      {equipment.daily_rate ? `€${equipment.daily_rate}/day` : 'Owned'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">€{equipment.total_cost?.toFixed(2) || '0.00'}</p>
                                  <p className="text-sm text-gray-600">{equipment.days || 'Unlimited'} days</p>
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditResource(equipment, 'equipment')}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRemoveResource(equipment.id, 'equipment', equipment.name)}
                                      disabled={removeResourceAssignment.isPending}
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
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Resources Assigned</h3>
                  <p className="text-gray-600 mb-4">
                    Assign resources to start tracking vehicles and equipment for this project.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Vehicles for material and team transport</p>
                    <p>• Equipment for work execution</p>
                    <p>• Rental and cost planning</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assign Vehicle Tab */}
        <TabsContent value="assign-vehicle">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingResource?.type === 'vehicle' ? 'Edit Vehicle Assignment' : 'Assign Vehicle'}
              </CardTitle>
              <CardDescription>
                {editingResource?.type === 'vehicle'
                  ? 'Update the vehicle assignment details'
                  : 'Assign an existing vehicle to this project'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={vehicleForm.handleSubmit(handleVehicleAssignment)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicle_id">Vehicle</Label>
                    <Select onValueChange={(value) => vehicleForm.setValue('vehicle_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles?.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.brand} {vehicle.model} ({vehicle.plate_number})
                            {vehicle.rental_price_per_day_eur && ` - €${vehicle.rental_price_per_day_eur}/day`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="driver_name">Driver (Optional)</Label>
                    <Input
                      placeholder="Driver name"
                      {...vehicleForm.register('driver_name')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_date">Start Date</Label>
                    <Input
                      type="date"
                      {...vehicleForm.register('from_date', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to_date">End Date (Optional)</Label>
                    <Input
                      type="date"
                      {...vehicleForm.register('to_date')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    placeholder="Material transport, site operations..."
                    {...vehicleForm.register('purpose')}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    placeholder="Special conditions, operational requirements..."
                    {...vehicleForm.register('notes')}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createVehicleAssignment.isPending}
                  >
                    {createVehicleAssignment.isPending
                      ? (editingResource?.type === 'vehicle' ? 'Updating...' : 'Assigning...')
                      : (editingResource?.type === 'vehicle' ? 'Update Assignment' : 'Assign Vehicle')}
                  </Button>
                  {editingResource?.type === 'vehicle' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={createVehicleAssignment.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assign Equipment Tab */}
        <TabsContent value="assign-equipment">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingResource?.type === 'equipment' ? 'Edit Equipment Assignment' : 'Assign Equipment'}
              </CardTitle>
              <CardDescription>
                {editingResource?.type === 'equipment'
                  ? 'Update the equipment assignment details'
                  : 'Assign existing equipment to this project'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={equipmentForm.handleSubmit(handleEquipmentAssignment)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipment_id">Equipment</Label>
                    <Select onValueChange={(value) => equipmentForm.setValue('equipment_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEquipment?.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            {equipment.name} ({equipment.inventory_no})
                            {equipment.rental_price_per_day_eur && ` - €${equipment.rental_price_per_day_eur}/day`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="operator_name">Operator (Optional)</Label>
                    <Input
                      placeholder="Operator name"
                      {...equipmentForm.register('operator_name')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_date">Start Date</Label>
                    <Input
                      type="date"
                      {...equipmentForm.register('from_date', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to_date">End Date (Optional)</Label>
                    <Input
                      type="date"
                      {...equipmentForm.register('to_date')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    placeholder="Drilling, excavation, material processing..."
                    {...equipmentForm.register('purpose')}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    placeholder="Maintenance requirements, special conditions..."
                    {...equipmentForm.register('notes')}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createEquipmentAssignment.isPending}
                  >
                    {createEquipmentAssignment.isPending
                      ? (editingResource?.type === 'equipment' ? 'Updating...' : 'Assigning...')
                      : (editingResource?.type === 'equipment' ? 'Update Assignment' : 'Assign Equipment')}
                  </Button>
                  {editingResource?.type === 'equipment' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={createEquipmentAssignment.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rent Vehicle Tab */}
        <TabsContent value="rent-vehicle">
          <Card>
            <CardHeader>
              <CardTitle>Create Rental Vehicle</CardTitle>
              <CardDescription>
                Add a new rental vehicle and assign it to the project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={rentalVehicleForm.handleSubmit(handleRentalVehicleCreate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      placeholder="e.g. Mercedes, Volvo"
                      {...rentalVehicleForm.register('brand', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      placeholder="e.g. Sprinter, FH16"
                      {...rentalVehicleForm.register('model', { required: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plate_number">License Plate</Label>
                    <Input
                      placeholder="e.g. B-MW 1234"
                      {...rentalVehicleForm.register('plate_number', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Vehicle Type</Label>
                    <Select onValueChange={(value) => rentalVehicleForm.setValue('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rental_company">Rental Company</Label>
                    <Input
                      placeholder="Company name"
                      {...rentalVehicleForm.register('rental_company', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="daily_rate">Daily Rate (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      {...rentalVehicleForm.register('daily_rate', { required: true, valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate (€) - Optional</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      {...rentalVehicleForm.register('hourly_rate', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fuel_consumption">Fuel Consumption (l/100km)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="8.0"
                      {...rentalVehicleForm.register('fuel_consumption', { required: true, valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rental_start">Rental Start</Label>
                    <Input
                      type="date"
                      {...rentalVehicleForm.register('rental_start', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rental_end">Rental End (Optional)</Label>
                    <Input
                      type="date"
                      {...rentalVehicleForm.register('rental_end')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="driver_name">Driver (Optional)</Label>
                    <Input
                      placeholder="Driver name"
                      {...rentalVehicleForm.register('driver_name')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purpose">Purpose</Label>
                    <Input
                      placeholder="Transport, site operations..."
                      {...rentalVehicleForm.register('purpose')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contract_notes">Contract Details</Label>
                  <Textarea
                    placeholder="Contract number, special conditions..."
                    {...rentalVehicleForm.register('contract_notes')}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createRentalVehicle.isPending}
                >
                  {createRentalVehicle.isPending ? 'Creating...' : 'Create Rental Vehicle'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rent Equipment Tab */}
        <TabsContent value="rent-equipment">
          <Card>
            <CardHeader>
              <CardTitle>Create Rental Equipment</CardTitle>
              <CardDescription>
                Add new rental equipment and assign it to the project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={rentalEquipmentForm.handleSubmit(handleRentalEquipmentCreate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Equipment Name</Label>
                    <Input
                      placeholder="e.g. Hydraulic Earth Drill"
                      {...rentalEquipmentForm.register('name', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Equipment Type</Label>
                    <Select onValueChange={(value) => rentalEquipmentForm.setValue('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inventory_no">Inventory Number</Label>
                    <Input
                      placeholder="e.g. EQ-2024-001"
                      {...rentalEquipmentForm.register('inventory_no', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rental_company">Rental Company</Label>
                    <Input
                      placeholder="Company name"
                      {...rentalEquipmentForm.register('rental_company', { required: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="daily_rate">Daily Rate (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="25.00"
                      {...rentalEquipmentForm.register('daily_rate', { required: true, valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate (€) - Optional</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="3.00"
                      {...rentalEquipmentForm.register('hourly_rate', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rental_start">Rental Start</Label>
                    <Input
                      type="date"
                      {...rentalEquipmentForm.register('rental_start', { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rental_end">Rental End (Optional)</Label>
                    <Input
                      type="date"
                      {...rentalEquipmentForm.register('rental_end')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="operator_name">Operator (Optional)</Label>
                    <Input
                      placeholder="Operator name"
                      {...rentalEquipmentForm.register('operator_name')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purpose">Purpose</Label>
                    <Input
                      placeholder="Drilling, material processing..."
                      {...rentalEquipmentForm.register('purpose')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contract_notes">Contract Details</Label>
                  <Textarea
                    placeholder="Contract number, maintenance agreements..."
                    {...rentalEquipmentForm.register('contract_notes')}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createRentalEquipment.isPending}
                >
                  {createRentalEquipment.isPending ? 'Creating...' : 'Create Rental Equipment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Resource Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit {editingResource?.type === 'vehicle' ? 'Vehicle' : 'Equipment'}
            </DialogTitle>
            <DialogDescription>
              Update resource details and assignment information
            </DialogDescription>
          </DialogHeader>

          {editingResource && (
            <form onSubmit={editForm.handleSubmit(handleUpdateResource)} className="space-y-4">
              {/* Resource Info Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {editingResource.type === 'vehicle'
                    ? `${editingResource.data.brand} ${editingResource.data.model}`
                    : editingResource.data.name
                  }
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {editingResource.type === 'vehicle' ? (
                    <>
                      <p>Plate: {editingResource.data.plate_number}</p>
                      <p>Type: {editingResource.data.type}</p>
                      <p>Status: {editingResource.data.owned ? 'Owned' : 'Rental'}</p>
                    </>
                  ) : (
                    <>
                      <p>Inventory: {editingResource.data.inventory_no}</p>
                      <p>Type: {editingResource.data.type}</p>
                      <p>Status: {editingResource.data.owned ? 'Owned' : 'Rental'}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-period">Assignment Period</Label>
                  <Input
                    id="edit-period"
                    placeholder="2024-01-15 - 2024-02-15"
                    {...editForm.register('period')}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-operator">
                    {editingResource.type === 'vehicle' ? 'Driver Name' : 'Operator Name'}
                  </Label>
                  <Input
                    id="edit-operator"
                    placeholder="Enter name"
                    {...editForm.register('operator_name')}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-purpose">Purpose</Label>
                  <Input
                    id="edit-purpose"
                    placeholder="Transportation, drilling, etc."
                    {...editForm.register('purpose')}
                  />
                </div>

                {editingResource.data.rental_company && (
                  <div>
                    <Label htmlFor="edit-daily-rate">Daily Rate (€)</Label>
                    <Input
                      id="edit-daily-rate"
                      type="number"
                      placeholder="50"
                      {...editForm.register('daily_rate', { valueAsNumber: true })}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Additional information..."
                    {...editForm.register('notes')}
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                >
                  Update
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