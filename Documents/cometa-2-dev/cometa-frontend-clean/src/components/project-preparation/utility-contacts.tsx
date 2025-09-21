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
import { Phone, Mail, User, Building, Plus, Edit, Trash2, FileText, Upload, Download, Eye, X } from 'lucide-react';
import {
  useUtilityContacts,
  useCreateUtilityContact,
  useUpdateUtilityContact,
  useDeleteUtilityContact,
  useProjectPlans,
  useCreateProjectPlan,
  useDeleteProjectPlan,
  type ProjectPlan
} from '@/hooks/use-project-preparation';
import { toast } from 'sonner';

interface UtilityContactsProps {
  projectId: string;
}

const UTILITY_KINDS = [
  { value: 'power', label: ' Power', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'water', label: 'Water', color: 'bg-blue-100 text-blue-800' },
  { value: 'gas', label: ' Gas', color: 'bg-red-100 text-red-800' },
  { value: 'telecom', label: 'Telecom', color: 'bg-purple-100 text-purple-800' },
  { value: 'road', label: 'Road', color: 'bg-gray-100 text-gray-800' },
  { value: 'municipality', label: 'Municipality', color: 'bg-green-100 text-green-800' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' },
];

const PLAN_TYPES = [
  { value: 'site_plan', label: 'Site Plan', color: 'bg-blue-100 text-blue-800' },
  { value: 'network_design', label: 'Network Design', color: 'bg-green-100 text-green-800' },
  { value: 'cable_routing', label: 'Cable Routing', color: 'bg-purple-100 text-purple-800' },
  { value: 'excavation_plan', label: 'Excavation Plan', color: 'bg-orange-100 text-orange-800' },
  { value: 'technical_drawing', label: 'Technical Drawing', color: 'bg-red-100 text-red-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' },
];

export default function UtilityContacts({ projectId }: UtilityContactsProps) {
  const { data: contacts, isLoading } = useUtilityContacts(projectId);
  const createContactMutation = useCreateUtilityContact();
  const updateContactMutation = useUpdateUtilityContact();
  const deleteContactMutation = useDeleteUtilityContact();

  // Plans data and mutations
  const { data: plans, isLoading: plansLoading } = useProjectPlans(projectId);
  const createPlanMutation = useCreateProjectPlan();
  const deletePlanMutation = useDeleteProjectPlan();

  const [showForm, setShowForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    kind: '',
    organization: '',
    phone: '',
    email: '',
    contact_person: '',
    notes: '',
  });

  // Plans state
  const [showPlanUpload, setShowPlanUpload] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    title: '',
    description: '',
    plan_type: '',
    file: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.kind || !formData.organization) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingContactId) {
        // Update existing contact
        await updateContactMutation.mutateAsync({
          id: editingContactId,
          ...formData,
        });
        setEditingContactId(null);
      } else {
        // Create new contact
        await createContactMutation.mutateAsync({
          project_id: projectId,
          ...formData,
        });
      }

      // Reset form
      setFormData({
        kind: '',
        organization: '',
        phone: '',
        email: '',
        contact_person: '',
        notes: '',
      });
      setShowForm(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleEdit = (contact: any) => {
    setFormData({
      kind: contact.kind,
      organization: contact.organization,
      phone: contact.phone || '',
      email: contact.email || '',
      contact_person: contact.contact_person || '',
      notes: contact.notes || '',
    });
    setEditingContactId(contact.id);
    setShowForm(true);
  };

  const handleDelete = async (contactId: string, organization: string) => {
    if (confirm(`Are you sure you want to delete the contact for "${organization}"?`)) {
      try {
        await deleteContactMutation.mutateAsync(contactId);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingContactId(null);
    setFormData({
      kind: '',
      organization: '',
      phone: '',
      email: '',
      contact_person: '',
      notes: '',
    });
    setShowForm(false);
  };

  const getKindInfo = (kind: string) => {
    return UTILITY_KINDS.find(k => k.value === kind) || {
      label: kind,
      color: 'bg-gray-100 text-gray-800'
    };
  };

  const getPlanTypeInfo = (planType: string) => {
    return PLAN_TYPES.find(p => p.value === planType) || {
      label: planType,
      color: 'bg-gray-100 text-gray-800'
    };
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planFormData.title || !planFormData.plan_type || !planFormData.file) {
      toast.error('Please fill in all required fields and select a file');
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', planFormData.file);
      formData.append('title', planFormData.title);
      formData.append('description', planFormData.description);
      formData.append('plan_type', planFormData.plan_type);
      formData.append('project_id', projectId);

      // For now, simulate upload success and add to local state
      // In real implementation, this would call an API endpoint
      const newPlan = {
        id: `plan_${Date.now()}`,
        title: planFormData.title,
        description: planFormData.description,
        plan_type: planFormData.plan_type,
        filename: planFormData.file.name,
        file_size: planFormData.file.size,
        uploaded_at: new Date().toISOString(),
      };

      setUploadedPlans(prev => [...prev, newPlan]);

      // Reset form
      setPlanFormData({
        title: '',
        description: '',
        plan_type: '',
        file: null,
      });
      setShowPlanUpload(false);
      toast.success('Plan uploaded successfully');

      // TODO: Replace with actual API call
      console.log('Plan upload data:', formData);
    } catch (error) {
      toast.error('Failed to upload plan');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, image files, and Excel files are allowed');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setPlanFormData(prev => ({ ...prev, file }));
    }
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      setUploadedPlans(prev => prev.filter(plan => plan.id !== planId));
      toast.success('Plan deleted successfully');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading || plansLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plans & Communications</h2>
          <p className="text-gray-600">
            Manage project plans and utility company contacts
          </p>
        </div>
      </div>

      {/* Project Plans Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project Plans
              </CardTitle>
              <CardDescription>
                Upload and manage technical plans and documents
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowPlanUpload(!showPlanUpload)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Plan Upload Form */}
          {showPlanUpload && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan-title">Plan Title *</Label>
                    <Input
                      id="plan-title"
                      value={planFormData.title}
                      onChange={(e) => setPlanFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Site plan, Network design, etc."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="plan-type">Plan Type *</Label>
                    <Select
                      value={planFormData.plan_type}
                      onValueChange={(value) => setPlanFormData(prev => ({ ...prev, plan_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="plan-description">Description</Label>
                  <Textarea
                    id="plan-description"
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the plan..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="plan-file">File *</Label>
                  <Input
                    id="plan-file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Supported formats: PDF, Images (JPG, PNG, GIF), Excel files. Max size: 10MB
                  </p>
                  {planFormData.file && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-700">
                        Selected: {planFormData.file.name} ({formatFileSize(planFormData.file.size)})
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createPlanMutation.isPending}>
                    <Upload className="w-4 h-4 mr-2" />
                    {createPlanMutation.isPending ? 'Uploading...' : 'Upload Plan'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPlanUpload(false);
                      setPlanFormData({ title: '', description: '', plan_type: '', file: null });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Plans List */}
          {!plans || plans.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Plans Uploaded</h3>
              <p className="text-gray-600 mb-4">
                Upload project plans, technical drawings, and design documents to get started.
              </p>
              <Button onClick={() => setShowPlanUpload(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload First Plan
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan: ProjectPlan) => {
                const planTypeInfo = getPlanTypeInfo(plan.plan_type);
                return (
                  <Card key={plan.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <Badge className={planTypeInfo.color}>
                            {planTypeInfo.label}
                          </Badge>
                          <h4 className="font-semibold mt-2 mb-1">{plan.title}</h4>
                          {plan.description && (
                            <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                          )}
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>File: {plan.filename}</p>
                            <p>Size: {formatFileSize(plan.file_size)}</p>
                            <p>Uploaded: {new Date(plan.uploaded_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <Button variant="ghost" size="sm" title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Download">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Utility Contacts Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Utility Contacts</h3>
          <p className="text-gray-600">
            Manage utility companies and emergency contacts for the project
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Add Contact Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingContactId ? 'Edit Utility Contact' : 'Add New Utility Contact'}
            </CardTitle>
            <CardDescription>
              {editingContactId
                ? 'Update contact information for utility company'
                : 'Add contact information for utility companies and emergency services'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kind">Type *</Label>
                  <Select
                    value={formData.kind}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, kind: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select utility type" />
                    </SelectTrigger>
                    <SelectContent>
                      {UTILITY_KINDS.map((kind) => (
                        <SelectItem key={kind.value} value={kind.value}>
                          {kind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="organization">Organization *</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    placeholder="Organization name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+49 xxx xxx xxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@utility.com"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional information or special instructions..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createContactMutation.isPending || updateContactMutation.isPending}
                >
                  {editingContactId ? 'Update Contact' : 'Add Contact'}
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

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Utility Contacts</CardTitle>
          <CardDescription>
            {contacts?.length || 0} contacts configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!contacts || contacts.length === 0 ? (
            <div className="text-center py-8">
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Utility Contacts</h3>
              <p className="text-gray-600 mb-4">
                Add utility companies and emergency contacts to get started.
              </p>
              <Button onClick={() => setShowForm(true)}>
                Add First Contact
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => {
                    const kindInfo = getKindInfo(contact.kind);
                    return (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <Badge className={kindInfo.color}>
                            {kindInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {contact.organization}
                        </TableCell>
                        <TableCell>
                          {contact.contact_person ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {contact.contact_person}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                {contact.phone}
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                {contact.email}
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.notes ? (
                            <span className="text-sm text-gray-600 max-w-xs truncate block">
                              {contact.notes}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(contact)}
                              disabled={updateContactMutation.isPending}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(contact.id, contact.organization)}
                              disabled={deleteContactMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {contacts && contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {UTILITY_KINDS.map((kind) => {
                const count = contacts.filter(c => c.kind === kind.value).length;
                return (
                  <div key={kind.value} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-gray-600">{kind.label}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}