'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Home, Plus, Edit, Trash2, Users, Bed } from 'lucide-react';
import {
  useHousingUnits,
  useCreateHousingUnit,
  useUpdateHousingUnit,
  useDeleteHousingUnit
} from '@/hooks/use-housing-units';
import { toast } from 'sonner';

interface HousingManagementProps {
  projectId: string;
}

export default function HousingManagement({ projectId }: HousingManagementProps) {
  const { data: housingUnits, isLoading } = useHousingUnits(projectId);
  const createHousingMutation = useCreateHousingUnit();
  const updateHousingMutation = useUpdateHousingUnit();
  const deleteHousingMutation = useDeleteHousingUnit();

  const [showForm, setShowForm] = useState(false);
  const [editingHousingId, setEditingHousingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    address: '',
    rooms_total: '',
    beds_total: '',
    rent_daily_eur: '',
    status: 'available',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address || !formData.rooms_total || !formData.beds_total || !formData.rent_daily_eur) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingHousingId) {
        // Update existing housing unit
        await updateHousingMutation.mutateAsync({
          id: editingHousingId,
          address: formData.address,
          rooms_total: parseInt(formData.rooms_total),
          beds_total: parseInt(formData.beds_total),
          rent_daily_eur: parseFloat(formData.rent_daily_eur),
          status: formData.status,
        });
        setEditingHousingId(null);
      } else {
        // Create new housing unit
        await createHousingMutation.mutateAsync({
          project_id: projectId,
          address: formData.address,
          rooms_total: parseInt(formData.rooms_total),
          beds_total: parseInt(formData.beds_total),
          rent_daily_eur: parseFloat(formData.rent_daily_eur),
          status: formData.status,
        });
      }

      // Reset form
      setFormData({
        address: '',
        rooms_total: '',
        beds_total: '',
        rent_daily_eur: '',
        status: 'available',
      });
      setShowForm(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleEdit = (housing: any) => {
    setFormData({
      address: housing.address,
      rooms_total: housing.rooms_total.toString(),
      beds_total: housing.beds_total.toString(),
      rent_daily_eur: housing.rent_daily_eur.toString(),
      status: housing.status,
    });
    setEditingHousingId(housing.id);
    setShowForm(true);
  };

  const handleDelete = async (housingId: string, address: string) => {
    if (confirm(`Are you sure you want to delete housing unit at "${address}"?`)) {
      try {
        await deleteHousingMutation.mutateAsync(housingId);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingHousingId(null);
    setFormData({
      address: '',
      rooms_total: '',
      beds_total: '',
      rent_daily_eur: '',
      status: 'available',
    });
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading housing units...</div>;
  }

  const totalBeds = housingUnits?.reduce((sum, unit) => sum + unit.beds_total, 0) || 0;
  const totalRooms = housingUnits?.reduce((sum, unit) => sum + unit.rooms_total, 0) || 0;
  const availableUnits = housingUnits?.filter(unit => unit.status === 'available').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Home className="w-5 h-5" />
            Housing Management
          </h3>
          <p className="text-gray-600">
            Manage accommodation for project team members
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Housing
        </Button>
      </div>

      {/* Stats Cards */}
      {housingUnits && housingUnits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Units</p>
                  <p className="text-2xl font-bold">{housingUnits.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Available</p>
                  <p className="text-2xl font-bold">{availableUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-purple-500 rounded"></div>
                <div>
                  <p className="text-sm font-medium">Total Rooms</p>
                  <p className="text-2xl font-bold">{totalRooms}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bed className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Total Beds</p>
                  <p className="text-2xl font-bold">{totalBeds}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Housing Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingHousingId ? 'Edit Housing Unit' : 'Add New Housing Unit'}
            </CardTitle>
            <CardDescription>
              Add accommodation for project team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Full address of the housing unit"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rooms">Total Rooms *</Label>
                  <Input
                    id="rooms"
                    type="number"
                    min="1"
                    value={formData.rooms_total}
                    onChange={(e) => setFormData(prev => ({ ...prev, rooms_total: e.target.value }))}
                    placeholder="Number of rooms"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="beds">Total Beds *</Label>
                  <Input
                    id="beds"
                    type="number"
                    min="1"
                    value={formData.beds_total}
                    onChange={(e) => setFormData(prev => ({ ...prev, beds_total: e.target.value }))}
                    placeholder="Number of beds"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rent">Daily Rent (EUR) *</Label>
                  <Input
                    id="rent"
                    type="number"
                    step="0.01"
                    value={formData.rent_daily_eur}
                    onChange={(e) => setFormData(prev => ({ ...prev, rent_daily_eur: e.target.value }))}
                    placeholder="Daily rental cost"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">🟢 Available</SelectItem>
                      <SelectItem value="occupied"> Occupied</SelectItem>
                      <SelectItem value="maintenance">🟡 Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createHousingMutation.isPending || updateHousingMutation.isPending}
                >
                  {editingHousingId ? 'Update Housing Unit' : 'Add Housing Unit'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Housing List */}
      <Card>
        <CardHeader>
          <CardTitle>Housing Units</CardTitle>
          <CardDescription>
            {housingUnits?.length || 0} housing units configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!housingUnits || housingUnits.length === 0 ? (
            <div className="text-center py-8">
              <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Housing Units</h3>
              <p className="text-gray-600 mb-4">
                Add housing accommodations for the project team.
              </p>
              <Button onClick={() => setShowForm(true)}>
                Add First Housing Unit
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Beds</TableHead>
                    <TableHead>Daily Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {housingUnits.map((housing) => (
                    <TableRow key={housing.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-gray-400" />
                          {housing.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          {housing.rooms_total}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4 text-gray-400" />
                          {housing.beds_total}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          €{housing.rent_daily_eur.toLocaleString()}/day
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(housing.status)}>
                          {housing.status.charAt(0).toUpperCase() + housing.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(housing)}
                            disabled={updateHousingMutation.isPending}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(housing.id, housing.address)}
                            disabled={deleteHousingMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}