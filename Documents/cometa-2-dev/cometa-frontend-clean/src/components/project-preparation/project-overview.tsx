'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Euro, MapPin, Calendar, User } from 'lucide-react';
import { useProjectPreparation, useUpdateProjectStatus } from '@/hooks/use-project-preparation';
import { toast } from 'sonner';

interface ProjectOverviewProps {
  projectId: string;
}

export default function ProjectOverview({ projectId }: ProjectOverviewProps) {
  const { data: preparation, isLoading } = useProjectPreparation(projectId);
  const updateStatusMutation = useUpdateProjectStatus();
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');

  if (isLoading || !preparation) {
    return <div>Loading project overview...</div>;
  }

  const { project, potential_revenue } = preparation;

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        project_id: projectId,
        status: newStatus,
        reason,
      });
      setShowStatusForm(false);
      setNewStatus('');
      setReason('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'waiting_invoice':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'waiting_invoice':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Basic Project Information
          </CardTitle>
          <CardDescription>
            Core project details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Project Name</Label>
              <p className="text-lg font-semibold">{project.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Customer</Label>
              <p className="text-lg">{project.customer || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">City</Label>
              <p className="text-lg">{project.city || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Address</Label>
              <p className="text-lg">{project.address || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">24/7 Contact</Label>
              <p className="text-lg">{project.contact_24h || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Project Manager</Label>
              <p className="text-lg">
                {project.project_manager || 'Not assigned'}
                {!project.project_manager && (
                  <span className="text-red-500 ml-2">No PM assigned</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning and Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Planning & Revenue Information
          </CardTitle>
          <CardDescription>
            Project timeline and potential revenue calculation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Start Date
              </Label>
              <p className="text-lg">{project.start_date || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Planned End Date
              </Label>
              <p className="text-lg">{project.end_date_plan || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Total Length</Label>
              <p className="text-lg font-semibold">{project.total_length_m.toLocaleString()} m</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Base Rate per Meter</Label>
              <p className="text-lg font-semibold">€{project.base_rate_per_m.toLocaleString()}/m</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Potential Revenue</Label>
              <p className="text-2xl font-bold text-green-600">
                €{potential_revenue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(project.status)}
            Project Status Management
          </CardTitle>
          <CardDescription>
            Current status and status change controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Current Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(project.status)}
                <Badge className={getStatusColor(project.status)}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowStatusForm(!showStatusForm)}
            >
              Change Status
            </Button>
          </div>

          {showStatusForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div>
                <Label htmlFor="new-status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft"> Draft</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="waiting_invoice"> Waiting Invoice</SelectItem>
                    <SelectItem value="closed"> Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Change</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the reason for the status change..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                >
                   Save Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStatusForm(false);
                    setNewStatus('');
                    setReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}