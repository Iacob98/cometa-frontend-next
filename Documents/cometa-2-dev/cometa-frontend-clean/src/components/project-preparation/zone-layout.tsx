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
import {
  Package,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Ruler,
  AlertTriangle,
  FileText,
  Router,
  Construction
} from 'lucide-react';
import {
  useCabinets,
  useCreateCabinet,
  useUpdateCabinet,
  useDeleteCabinet,
} from '@/hooks/use-zone-layout';
import { toast } from 'sonner';

interface ZoneLayoutProps {
  projectId: string;
}

const CABINET_STATUSES = [
  { value: 'planned', label: 'Planned', color: 'bg-blue-100 text-blue-800' },
  { value: 'installed', label: 'Installed', color: 'bg-green-100 text-green-800' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
];

const CONSTRAINT_TYPES = [
  { value: 'road_work', label: '🚧 Road Work', description: 'Traffic-related restrictions' },
  { value: 'power_lines', label: ' Power Lines', description: 'High voltage lines and transformers' },
  { value: 'utilities', label: '💧 Water/Sewer', description: 'Existing utility networks' },
  { value: 'vegetation', label: '🌳 Green Areas', description: 'Trees and protected areas' },
  { value: 'buildings', label: ' Existing Buildings', description: 'Buildings and structures' },
  { value: 'road_crossing', label: '🛣️ Road Crossings', description: 'Roadways and sidewalks' },
  { value: 'telecom', label: '📡 Telecom', description: 'Existing cable networks' },
  { value: 'underground', label: '🚇 Underground', description: 'Subway, underground passages' },
];

export default function ZoneLayout({ projectId }: ZoneLayoutProps) {
  const { data: cabinets, isLoading: cabinetsLoading } = useCabinets(projectId);
  const createCabinetMutation = useCreateCabinet();
  const updateCabinetMutation = useUpdateCabinet();
  const deleteCabinetMutation = useDeleteCabinet();

  const [showCabinetForm, setShowCabinetForm] = useState(false);
  const [showConstraintForm, setShowConstraintForm] = useState(false);
  const [editingCabinetId, setEditingCabinetId] = useState<string | null>(null);
  const [cabinetFormData, setCabinetFormData] = useState({
    code: '',
    name: '',
    address: '',
    notes: '',
  });

  const handleSubmitCabinet = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cabinetFormData.code || !cabinetFormData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingCabinetId) {
        // Update existing cabinet
        await updateCabinetMutation.mutateAsync({
          id: editingCabinetId,
          ...cabinetFormData,
        });
        setEditingCabinetId(null);
      } else {
        // Create new cabinet
        await createCabinetMutation.mutateAsync({
          project_id: projectId,
          ...cabinetFormData,
        });
      }

      // Reset form
      setCabinetFormData({
        code: '',
        name: '',
        address: '',
        notes: '',
      });
      setShowCabinetForm(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleEditCabinet = (cabinet: any) => {
    setCabinetFormData({
      code: cabinet.code,
      name: cabinet.name,
      address: cabinet.address || '',
      notes: cabinet.notes || '',
    });
    setEditingCabinetId(cabinet.id);
    setShowCabinetForm(true);
  };

  const handleDeleteCabinet = async (cabinetId: string, cabinetCode: string) => {
    if (confirm(`Are you sure you want to delete cabinet "${cabinetCode}"? This will also delete all associated segments.`)) {
      try {
        await deleteCabinetMutation.mutateAsync(cabinetId);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingCabinetId(null);
    setCabinetFormData({
      code: '',
      name: '',
      address: '',
      notes: '',
    });
    setShowCabinetForm(false);
  };

  const getStatusInfo = (status: string) => {
    return CABINET_STATUSES.find(s => s.value === status) || {
      label: status,
      color: 'bg-gray-100 text-gray-800'
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Zone Layout Management</h3>
          <p className="text-gray-600">
            Manage cabinets and project constraints
          </p>
        </div>
      </div>

      <Tabs defaultValue="cabinets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cabinets" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            NVT Points
          </TabsTrigger>
          <TabsTrigger value="constraints" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Constraints
          </TabsTrigger>
          <TabsTrigger value="installation" className="flex items-center gap-2">
            <Construction className="w-4 h-4" />
            Installation
          </TabsTrigger>
        </TabsList>

        {/* Cabinets Tab */}
        <TabsContent value="cabinets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">NVT Points (Network Termination)</h4>
            <Button
              onClick={() => setShowCabinetForm(!showCabinetForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add NVT Point
            </Button>
          </div>

          {/* Add Cabinet Form */}
          {showCabinetForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCabinetId ? 'Edit NVT Point' : 'Add New NVT Point'}
                </CardTitle>
                <CardDescription>
                  {editingCabinetId
                    ? 'Update network termination point information'
                    : 'Create a new network termination point for the project'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitCabinet} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">NVT Code *</Label>
                      <Input
                        id="code"
                        value={cabinetFormData.code}
                        onChange={(e) => setCabinetFormData(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="9V1005"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={cabinetFormData.name}
                        onChange={(e) => setCabinetFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Cabinet Entrance 1"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={cabinetFormData.address}
                        onChange={(e) => setCabinetFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Müllerstraße 1, 13353 Berlin"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={cabinetFormData.notes}
                        onChange={(e) => setCabinetFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional information..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createCabinetMutation.isPending || updateCabinetMutation.isPending}
                    >
                      {editingCabinetId ? 'Update NVT Point' : 'Create NVT Point'}
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

          {/* Cabinets List */}
          <Card>
            <CardHeader>
              <CardTitle>NVT Points List</CardTitle>
              <CardDescription>
                {cabinets?.length || 0} NVT points configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cabinetsLoading ? (
                <div>Loading cabinets...</div>
              ) : !cabinets || cabinets.length === 0 ? (
                <div className="text-center py-8">
                  <Router className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No NVT Points</h3>
                  <p className="text-gray-600 mb-4">
                    Add network termination points to get started.
                  </p>
                  <Button onClick={() => setShowCabinetForm(true)}>
                    Add First NVT Point
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Segments</TableHead>
                        <TableHead>Total Length</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cabinets.map((cabinet) => (
                        <TableRow key={cabinet.id}>
                          <TableCell className="font-medium">
                            {cabinet.code}
                          </TableCell>
                          <TableCell>{cabinet.name}</TableCell>
                          <TableCell>
                            {cabinet.address ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {cabinet.address}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {cabinet.segment_count || 0} segments
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cabinet.total_length ? `${cabinet.total_length.toFixed(1)}m` : '0.0m'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCabinet(cabinet)}
                                disabled={updateCabinetMutation.isPending}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCabinet(cabinet.id, cabinet.code)}
                                disabled={deleteCabinetMutation.isPending}
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
        </TabsContent>


        {/* Constraints Tab */}
        <TabsContent value="constraints" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Project Constraints & Obstacles</h4>
            <Button
              onClick={() => setShowConstraintForm(!showConstraintForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Constraint
            </Button>
          </div>

          {/* Constraint Types Information */}
          <Card>
            <CardHeader>
              <CardTitle>Planned Constraint Types</CardTitle>
              <CardDescription>
                Common obstacles encountered during fiber optic installation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CONSTRAINT_TYPES.map((constraint) => (
                  <div key={constraint.value} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{constraint.label}</div>
                      <div className="text-sm text-gray-600">{constraint.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Constraint Form */}
          {showConstraintForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add Project Constraint</CardTitle>
                <CardDescription>
                  Document obstacles and restrictions for planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="constraint-type">Constraint Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select constraint type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONSTRAINT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="severity">Criticality</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Specific location or address"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="description">Constraint Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the constraint and its impact..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button disabled>
                      Add Constraint
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowConstraintForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-sm text-blue-600">
                    ℹ️ This function will be available in future updates
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Installation Plans Tab */}
        <TabsContent value="installation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cabinet Installation Plans</CardTitle>
              <CardDescription>
                Installation procedures for new cabinet enclosures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lower Part */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Construction className="w-5 h-5" />
                    Lower Cabinet Part
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium">1.  Installation Site Marking</h5>
                      <ul className="text-sm text-gray-600 ml-4 space-y-1">
                        <li>• Determine exact location per project</li>
                        <li>• Check for absence of utility lines</li>
                        <li>• Mark excavation outline</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium">2. ⛏️ Earthwork</h5>
                      <ul className="text-sm text-gray-600 ml-4 space-y-1">
                        <li>• Excavate pit according to cabinet size</li>
                        <li>• Depth: typically 1.2-1.5m</li>
                        <li>• Install formwork if needed</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium">3. 📡 Cable Routing</h5>
                      <ul className="text-sm text-gray-600 ml-4 space-y-1">
                        <li>• Route incoming cables to installation site</li>
                        <li>• Prepare cable penetrations</li>
                        <li>• Ensure watertight sealing</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium">4.  Lower Part Installation</h5>
                      <ul className="text-sm text-gray-600 ml-4 space-y-1">
                        <li>• Install cabinet base</li>
                        <li>• Level with spirit level</li>
                        <li>• Backfill and compact</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Upper Part */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Router className="w-5 h-5" />
                    Upper Cabinet Part
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium">1.  Preparation per Plans</h5>
                      <ul className="text-sm text-gray-600 ml-4 space-y-1">
                        <li>• Study connection diagram</li>
                        <li>• Prepare required materials</li>
                        <li>• Check equipment completeness</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium">2. 🔗 Connection Assembly</h5>
                      <ul className="text-sm text-gray-600 ml-4 space-y-1">
                        <li>• Route all cables into cabinet</li>
                        <li>• Perform fiber splicing per diagram</li>
                        <li>• Install splitters and patch panels</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium">3.  Equipment Connection</h5>
                      <ul className="text-sm text-gray-600 ml-4 space-y-1">
                        <li>• Install active equipment</li>
                        <li>• Connect power supply</li>
                        <li>• Configure equipment</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium">4.  Testing & Completion</h5>
                      <ul className="text-sm text-gray-600 ml-4 space-y-1">
                        <li>• Test all connections</li>
                        <li>• Measure line attenuation</li>
                        <li>• Close and seal cabinet</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="mt-8 border-t pt-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Cabinet Plans Upload
                </h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Cabinet Plans</h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop files here or click to browse
                  </p>
                  <Button variant="outline">
                    Select Files
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Supported formats: PDF, DWG, PNG, JPG, JPEG
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}