'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, AlertTriangle, FileText, Users, Package, Home, Settings, Rocket, FileCheck, MessageSquare, PlayCircle, PauseCircle, BarChart3, Cog } from 'lucide-react';
import { useProjectReadiness, useUpdateProjectStatus, useCreateProjectActivation, useProjectChecklist } from '@/hooks/use-project-readiness';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ReadinessProps {
  projectId: string;
}

interface ActivationForm {
  activation_date: string;
  activation_notes?: string;
  responsible_manager: string;
  notify_stakeholders: boolean;
}

const READINESS_CATEGORIES = [
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'All required documents and plans',
    icon: FileText,
    color: 'text-blue-600',
    checks: [
      'Project plans uploaded',
      'Utility contact information complete',
      'Building permits obtained',
      'Safety documentation complete'
    ]
  },
  {
    id: 'resources',
    title: 'Resources',
    description: 'Teams, equipment, and materials',
    icon: Users,
    color: 'text-green-600',
    checks: [
      'Team assignments complete',
      'Equipment allocation finalized',
      'Material inventory sufficient',
      'Subcontractors confirmed'
    ]
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    description: 'Zone layout and house connections',
    icon: Settings,
    color: 'text-orange-600',
    checks: [
      'Zone layout confirmed',
      'Cabinet locations defined',
      'House connections mapped',
      'Network segments planned'
    ]
  },
  {
    id: 'approvals',
    title: 'Approvals',
    description: 'Required authorizations and sign-offs',
    icon: CheckCircle,
    color: 'text-purple-600',
    checks: [
      'Management approval obtained',
      'Customer agreements signed',
      'Regulatory clearances complete',
      'Budget authorization confirmed'
    ]
  }
];

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-800', icon: FileText },
  { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'active', label: 'Active', color: 'bg-orange-100 text-orange-800', icon: Rocket },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800', icon: PauseCircle },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
];

export default function Readiness({ projectId }: ReadinessProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: readinessData, isLoading, error, refetch } = useProjectReadiness(projectId);
  const { data: checklist } = useProjectChecklist(projectId);
  const updateStatus = useUpdateProjectStatus();
  const createActivation = useCreateProjectActivation();

  const activationForm = useForm<ActivationForm>();

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
            <h3 className="text-lg font-medium mb-2">Error Loading Readiness Data</h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        project_id: projectId,
        status: newStatus,
      });
      refetch();
      toast.success(`Project status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update project status');
    }
  };

  const handleActivation = async (data: ActivationForm) => {
    try {
      await createActivation.mutateAsync({
        ...data,
        project_id: projectId,
      });
      activationForm.reset();
      refetch();
      toast.success('Project activation initiated successfully');
    } catch (error) {
      toast.error('Failed to activate project');
    }
  };

  const overallReadiness = readinessData?.overall_readiness || 0;
  const totalChecks = readinessData?.total_checks || 0;
  const completedChecks = readinessData?.completed_checks || 0;
  const currentStatus = readinessData?.project_status || 'planning';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Rocket className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold">Project Readiness & Activation</h3>
          </div>
          <p className="text-gray-600">Final checks and project activation management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={PROJECT_STATUSES.find(s => s.value === currentStatus)?.color || 'bg-gray-100 text-gray-800'}>
            {PROJECT_STATUSES.find(s => s.value === currentStatus)?.label || currentStatus}
          </Badge>
        </div>
      </div>

      {/* Overall Readiness Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Rocket className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Overall Readiness</p>
                <p className="text-2xl font-bold">{overallReadiness}%</p>
                <Progress value={overallReadiness} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Checks Complete</p>
                <p className="text-2xl font-bold">{completedChecks}/{totalChecks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Days to Start</p>
                <p className="text-2xl font-bold">{readinessData?.days_to_start || '--'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Critical Issues</p>
                <p className="text-2xl font-bold">{readinessData?.critical_issues || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Readiness Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Readiness Overview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="activation">Activation</TabsTrigger>
        </TabsList>

        {/* Readiness Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {READINESS_CATEGORIES.map((category) => {
              const categoryData = readinessData?.categories?.[category.id];
              const completedCount = categoryData?.completed || 0;
              const totalCount = category.checks.length;
              const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const Icon = category.icon;

              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all ${selectedCategory === category.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-5 h-5 ${category.color}`} />
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                      </div>
                      <Badge variant={percentage === 100 ? 'default' : 'secondary'}>
                        {completedCount}/{totalCount}
                      </Badge>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{percentage}%</span>
                      </div>
                      <Progress value={percentage} />

                      {selectedCategory === category.id && (
                        <div className="pt-3 space-y-2">
                          {category.checks.map((check, index) => {
                            const isCompleted = categoryData?.completed_checks?.includes(index) || false;
                            return (
                              <div key={index} className="flex items-center space-x-2">
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                <span className={`text-sm ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                                  {check}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Critical Issues */}
          {readinessData?.issues && readinessData.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Critical Issues</span>
                </CardTitle>
                <CardDescription>
                  Issues that must be resolved before project activation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {readinessData.issues.map((issue, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border-l-4 border-l-red-500 bg-red-50">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-800">{issue.title}</p>
                        <p className="text-sm text-red-600">{issue.description}</p>
                        {issue.action_required && (
                          <p className="text-sm font-medium text-red-700 mt-1">
                            Action Required: {issue.action_required}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Readiness Checklist</CardTitle>
              <CardDescription>
                Complete all items below before activating the project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checklist && checklist.length > 0 ? (
                <div className="space-y-4">
                  {checklist.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {item.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : item.required ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${item.completed ? 'text-green-700' : 'text-gray-900'}`}>
                            {item.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {item.required && (
                              <Badge variant="destructive" size="sm">Required</Badge>
                            )}
                            <Badge variant={item.completed ? 'default' : 'secondary'} size="sm">
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        {item.completed && item.completed_date && (
                          <p className="text-xs text-green-600 mt-1">
                            Completed: {item.completed_date}
                          </p>
                        )}
                        {!item.completed && item.action_required && (
                          <p className="text-sm font-medium text-orange-600 mt-1">
                            Action: {item.action_required}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Checklist Available</h3>
                  <p className="text-gray-600">
                    The readiness checklist will be generated based on project requirements.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activation Tab */}
        <TabsContent value="activation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status Management</CardTitle>
                <CardDescription>
                  Update project status based on readiness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Current Status</Label>
                    <div className="mt-1">
                      <Badge className={PROJECT_STATUSES.find(s => s.value === currentStatus)?.color || 'bg-gray-100 text-gray-800'}>
                        {PROJECT_STATUSES.find(s => s.value === currentStatus)?.label || currentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Change Status</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {PROJECT_STATUSES.map((status) => (
                        <Button
                          key={status.value}
                          variant={currentStatus === status.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusUpdate(status.value)}
                          disabled={updateStatus.isPending || currentStatus === status.value}
                          className="justify-start"
                        >
                          <div className="flex items-center space-x-2">
                            {status.icon && <status.icon className="w-4 h-4" />}
                            <span>{status.label}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Activation */}
            <Card>
              <CardHeader>
                <CardTitle>Project Activation</CardTitle>
                <CardDescription>
                  Activate the project when all requirements are met
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overallReadiness >= 90 ? (
                  <form onSubmit={activationForm.handleSubmit(handleActivation)} className="space-y-4">
                    <div>
                      <Label htmlFor="activation_date">Activation Date</Label>
                      <Input
                        type="date"
                        {...activationForm.register('activation_date', { required: true })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="responsible_manager">Responsible Manager</Label>
                      <Input
                        placeholder="Project Manager Name"
                        {...activationForm.register('responsible_manager', { required: true })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="activation_notes">Activation Notes</Label>
                      <Textarea
                        placeholder="Special instructions or notes for activation..."
                        {...activationForm.register('activation_notes')}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notify_stakeholders"
                        {...activationForm.register('notify_stakeholders')}
                      />
                      <Label htmlFor="notify_stakeholders" className="text-sm">
                        Notify all stakeholders
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createActivation.isPending}
                    >
                      {createActivation.isPending ? 'Activating...' : 'Activate Project'}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto h-12 w-12 text-orange-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Project Not Ready</h3>
                    <p className="text-gray-600 mb-4">
                      Project must be at least 90% ready for activation.
                      Current readiness: {overallReadiness}%
                    </p>
                    <p className="text-sm text-gray-500">
                      Complete the missing requirements in the checklist to enable activation.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}