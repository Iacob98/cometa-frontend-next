'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Home, Plus, Edit, Trash2, MapPin, Euro, Calendar } from 'lucide-react';
import { useFacilities, useCreateFacility } from '@/hooks/use-project-preparation';
import { useHousingUnits, useCreateHousingUnit, useUpdateHousingUnit, useDeleteHousingUnit } from '@/hooks/use-housing-units';
import { toast } from 'sonner';

interface FacilitiesManagementProps {
  projectId: string;
}

export default function FacilitiesManagement({ projectId }: FacilitiesManagementProps) {
  const { data: facilities, isLoading: facilitiesLoading } = useFacilities(projectId);
  const { data: housingUnits, isLoading: housingLoading } = useHousingUnits(projectId);
  const createFacilityMutation = useCreateFacility();
  const createHousingMutation = useCreateHousingUnit();
  const updateHousingMutation = useUpdateHousingUnit();
  const deleteHousingMutation = useDeleteHousingUnit();

  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [showHousingForm, setShowHousingForm] = useState(false);
  const [editingHousingId, setEditingHousingId] = useState<string | null>(null);

  const [facilityForm, setFacilityForm] = useState({
    type: '',
    rent_daily_eur: '',
    service_freq: '',
    status: 'planned',
    start_date: '',
    end_date: '',
    location_text: '',
  });

  const [housingForm, setHousingForm] = useState({
    address: '',
    rooms_total: '',
    beds_total: '',
    rent_daily_eur: '',
    status: 'available',
  });

  const handleFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!facilityForm.type || !facilityForm.rent_daily_eur) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createFacilityMutation.mutateAsync({
        project_id: projectId,
        type: facilityForm.type,
        rent_daily_eur: parseFloat(facilityForm.rent_daily_eur),
        service_freq: facilityForm.service_freq || undefined,
        status: facilityForm.status,
        start_date: facilityForm.start_date || undefined,
        end_date: facilityForm.end_date || undefined,
        location_text: facilityForm.location_text || undefined,
      });

      // Reset form
      setFacilityForm({
        type: '',
        rent_daily_eur: '',
        service_freq: '',
        status: 'planned',
        start_date: '',
        end_date: '',
        location_text: '',
      });
      setShowFacilityForm(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleHousingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!housingForm.address || !housingForm.rooms_total || !housingForm.beds_total || !housingForm.rent_daily_eur) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingHousingId) {
        // Update existing housing unit
        await updateHousingMutation.mutateAsync({
          id: editingHousingId,
          address: housingForm.address,
          rooms_total: parseInt(housingForm.rooms_total),
          beds_total: parseInt(housingForm.beds_total),
          rent_daily_eur: parseFloat(housingForm.rent_daily_eur),
          status: housingForm.status,
        });
        setEditingHousingId(null);
      } else {
        // Create new housing unit
        await createHousingMutation.mutateAsync({
          project_id: projectId,
          address: housingForm.address,
          rooms_total: parseInt(housingForm.rooms_total),
          beds_total: parseInt(housingForm.beds_total),
          rent_daily_eur: parseFloat(housingForm.rent_daily_eur),
          status: housingForm.status,
        });
      }

      // Reset form
      setHousingForm({
        address: '',
        rooms_total: '',
        beds_total: '',
        rent_daily_eur: '',
        status: 'available',
      });
      setShowHousingForm(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleEditHousing = (housing: any) => {
    setHousingForm({
      address: housing.address,
      rooms_total: housing.rooms_total.toString(),
      beds_total: housing.beds_total.toString(),
      rent_daily_eur: housing.rent_daily_eur.toString(),
      status: housing.status,
    });
    setEditingHousingId(housing.id);
    setShowHousingForm(true);
  };

  const handleDeleteHousing = async (housingId: string, address: string) => {
    if (confirm(`Are you sure you want to delete housing unit at "${address}"?`)) {
      try {
        await deleteHousingMutation.mutateAsync(housingId);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleCancelHousingEdit = () => {
    setEditingHousingId(null);
    setHousingForm({
      address: '',
      rooms_total: '',
      beds_total: '',
      rent_daily_eur: '',
      status: 'available',
    });
    setShowHousingForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
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

  if (facilitiesLoading || housingLoading) {
    return <div>Loading facilities and housing...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Facilities & Housing Management</h3>
        <p className="text-gray-600">
          Manage project facilities and housing arrangements for the team
        </p>
      </div>

      <Tabs defaultValue="facilities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="facilities" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Facilities
          </TabsTrigger>
          <TabsTrigger value="housing" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Housing
          </TabsTrigger>
        </TabsList>

        {/* Facilities Tab */}
        <TabsContent value="facilities" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium">Project Facilities</h4>
              <p className="text-sm text-gray-600">
                {facilities?.length || 0} facilities configured
              </p>
            </div>
            <Button
              onClick={() => setShowFacilityForm(!showFacilityForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Facility
            </Button>
          </div>

          {/* Add Facility Form */}
          {showFacilityForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Facility</CardTitle>
                <CardDescription>
                  Add a new facility for the project (e.g., office, warehouse, site office)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFacilitySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="facility-type">Facility Type *</Label>
                      <Input
                        id="facility-type"
                        value={facilityForm.type}
                        onChange={(e) => setFacilityForm(prev => ({ ...prev, type: e.target.value }))}
                        placeholder="e.g., Site Office, Warehouse, Storage"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="facility-rent">Daily Rent (EUR) *</Label>
                      <Input
                        id="facility-rent"
                        type="number"
                        step="0.01"
                        value={facilityForm.rent_daily_eur}
                        onChange={(e) => setFacilityForm(prev => ({ ...prev, rent_daily_eur: e.target.value }))}
                        placeholder="150.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="facility-status">Status</Label>
                      <Select
                        value={facilityForm.status}
                        onValueChange={(value) => setFacilityForm(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">🟡 Planned</SelectItem>
                          <SelectItem value="active">🟢 Active</SelectItem>
                          <SelectItem value="completed">🔵 Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="service-freq">Service Frequency</Label>
                      <Input
                        id="service-freq"
                        value={facilityForm.service_freq}
                        onChange={(e) => setFacilityForm(prev => ({ ...prev, service_freq: e.target.value }))}
                        placeholder="e.g., Weekly, Daily"
                      />
                    </div>

                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={facilityForm.start_date}
                        onChange={(e) => setFacilityForm(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={facilityForm.end_date}
                        onChange={(e) => setFacilityForm(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={facilityForm.location_text}
                      onChange={(e) => setFacilityForm(prev => ({ ...prev, location_text: e.target.value }))}
                      placeholder="Facility address or location description"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createFacilityMutation.isPending}
                    >
                      Add Facility
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowFacilityForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Facilities List */}
          <Card>
            <CardContent className="p-6">
              {!facilities || facilities.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Facilities</h3>
                  <p className="text-gray-600 mb-4">
                    Add facilities needed for the project.
                  </p>
                  <Button onClick={() => setShowFacilityForm(true)}>
                    Add First Facility
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Daily Rent</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilities.map((facility) => (
                      <TableRow key={facility.id}>
                        <TableCell className="font-medium">
                          {facility.type}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(facility.status)}>
                            {facility.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          €{facility.rent_daily_eur.toLocaleString()}/day
                        </TableCell>
                        <TableCell>
                          {facility.start_date && facility.end_date ? (
                            <span className="text-sm">
                              {facility.start_date} - {facility.end_date}
                            </span>
                          ) : facility.start_date ? (
                            <span className="text-sm">From {facility.start_date}</span>
                          ) : (
                            <span className="text-gray-400">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {facility.location_text || (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {facility.supplier_name || (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Housing Tab */}
        <TabsContent value="housing" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium">Housing Units</h4>
              <p className="text-sm text-gray-600">
                {housingUnits?.length || 0} housing units configured
              </p>
            </div>
            <Button
              onClick={() => setShowHousingForm(!showHousingForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Housing
            </Button>
          </div>

          {/* Add Housing Form */}
          {showHousingForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingHousingId ? 'Edit Housing Unit' : 'Add New Housing Unit'}
                </CardTitle>
                <CardDescription>
                  {editingHousingId
                    ? 'Update housing unit information'
                    : 'Add accommodation for project team members'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleHousingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="housing-address">Address *</Label>
                      <Input
                        id="housing-address"
                        value={housingForm.address}
                        onChange={(e) => setHousingForm(prev => ({ ...prev, address: e.target.value }))}
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
                        value={housingForm.rooms_total}
                        onChange={(e) => setHousingForm(prev => ({ ...prev, rooms_total: e.target.value }))}
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
                        value={housingForm.beds_total}
                        onChange={(e) => setHousingForm(prev => ({ ...prev, beds_total: e.target.value }))}
                        placeholder="Number of beds"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="housing-rent">Daily Rent (EUR) *</Label>
                      <Input
                        id="housing-rent"
                        type="number"
                        step="0.01"
                        value={housingForm.rent_daily_eur}
                        onChange={(e) => setHousingForm(prev => ({ ...prev, rent_daily_eur: e.target.value }))}
                        placeholder="Daily rental cost"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="housing-status">Status</Label>
                      <Select
                        value={housingForm.status}
                        onValueChange={(value) => setHousingForm(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">🟢 Available</SelectItem>
                          <SelectItem value="occupied">🔴 Occupied</SelectItem>
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
                      onClick={handleCancelHousingEdit}
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
            <CardContent className="p-6">
              {!housingUnits || housingUnits.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Housing Units</h3>
                  <p className="text-gray-600 mb-4">
                    Add housing accommodations for the project team.
                  </p>
                  <Button onClick={() => setShowHousingForm(true)}>
                    Add First Housing Unit
                  </Button>
                </div>
              ) : (
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
                        <TableCell className="font-medium">
                          {housing.address}
                        </TableCell>
                        <TableCell>{housing.rooms_total}</TableCell>
                        <TableCell>{housing.beds_total}</TableCell>
                        <TableCell>
                          €{housing.rent_daily_eur.toLocaleString()}/day
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(housing.status)}>
                            {housing.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditHousing(housing)}
                              disabled={updateHousingMutation.isPending}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHousing(housing.id, housing.address)}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}