"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  BarChart3,
  Clock,
  Users,
  Download,
  RefreshCw,
  TrendingUp,
  Eye
} from "lucide-react";

import {
  useActivities,
  useActivityStats,
  getActivityTypeLabel,
  getActivityTypeColor,
  ACTIVITY_TYPES,
  type ActivityFilters
} from "@/hooks/use-activities";

export default function ActivitiesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ActivityFilters>({
    page: 1,
    per_page: 50,
  });

  const { data: activities, isLoading, error, refetch } = useActivities(filters);
  const { data: stats, isLoading: statsLoading } = useActivityStats({
    user_id: filters.user_id,
    project_id: filters.project_id,
    activity_type: filters.activity_type,
    date_from: filters.date_from,
    date_to: filters.date_to,
  });

  const handleFilterChange = (key: keyof ActivityFilters, value: string | number) => {
    // Convert "all" values to undefined for proper filtering
    const actualValue = value === "all" ? undefined : value;

    setFilters(prev => ({
      ...prev,
      [key]: actualValue,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleDateRangeFilter = (range: string) => {
    const now = new Date();
    let dateFrom: string | undefined;

    switch (range) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'month':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'all':
      default:
        dateFrom = undefined;
        break;
    }

    setFilters(prev => ({
      ...prev,
      date_from: dateFrom,
      page: 1,
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-semibold">Error Loading Activities</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Failed to load activity log. Please try again.
              </p>
              <Button onClick={() => refetch()} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Complete audit trail of system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">
            Activity Log ({activities?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-6">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overview.total_activities}</div>
                  <p className="text-xs text-muted-foreground">
                    All logged activities
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overview.unique_users}</div>
                  <p className="text-xs text-muted-foreground">
                    Users with activity
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activity Types</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overview.activity_types_count}</div>
                  <p className="text-xs text-muted-foreground">
                    Different action types
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overview.active_projects}</div>
                  <p className="text-xs text-muted-foreground">
                    Projects with activity
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    className="pl-9"
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                <Select onValueChange={(value) => handleFilterChange('activity_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getActivityTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={handleDateRangeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="datetime-local"
                  placeholder="From date"
                  value={filters.date_from ? new Date(filters.date_from).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value ? new Date(e.target.value).toISOString() : '')}
                />

                <Input
                  type="datetime-local"
                  placeholder="To date"
                  value={filters.date_to ? new Date(filters.date_to).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value ? new Date(e.target.value).toISOString() : '')}
                />

                <Select onValueChange={(value) => handleFilterChange('per_page', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                    <SelectItem value="200">200 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Activities Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                {activities?.total || 0} activities found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[80px]" />
                    </div>
                  ))}
                </div>
              ) : !activities?.activities || activities.activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Activities Found</h3>
                  <p className="text-gray-600 mb-4">
                    No activities match the current filters.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ page: 1, per_page: 50 })}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {formatTimestamp(activity.timestamp)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-sm">
                                  {activity.user?.name || 'Unknown User'}
                                </div>
                                {activity.user?.role && (
                                  <div className="text-xs text-muted-foreground">
                                    {activity.user.role}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActivityTypeColor(activity.activity_type)}>
                              {getActivityTypeLabel(activity.activity_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm max-w-xs truncate block">
                              {activity.description}
                            </span>
                          </TableCell>
                          <TableCell>
                            {activity.project ? (
                              <span className="text-sm font-medium">
                                {activity.project.name}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Show activity details in a modal or navigate to details page
                                console.log('View activity details:', activity);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {activities && activities.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((activities.page - 1) * activities.per_page) + 1} to{' '}
                {Math.min(activities.page * activities.per_page, activities.total)} of{' '}
                {activities.total} activities
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
                  disabled={activities.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                  disabled={activities.page >= activities.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {statsLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Activity Types Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Types</CardTitle>
                  <CardDescription>
                    Distribution of activity types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.activity_types.slice(0, 10).map((type) => (
                      <div key={type.activity_type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getActivityTypeColor(type.activity_type)}>
                            {getActivityTypeLabel(type.activity_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{type.count}</span>
                          <span className="text-sm text-muted-foreground">
                            ({type.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Active Users</CardTitle>
                  <CardDescription>
                    Users with the highest activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.most_active_users.slice(0, 10).map((user, index) => (
                      <div key={user.user_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{user.user_name}</div>
                            <div className="text-sm text-muted-foreground">{user.role}</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {user.activity_count} activities
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Project Activity */}
              {stats.project_activity.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Project Activity</CardTitle>
                    <CardDescription>
                      Most active projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.project_activity.slice(0, 10).map((project, index) => (
                        <div key={project.project_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                              {index + 1}
                            </div>
                            <div className="font-medium">{project.project_name}</div>
                          </div>
                          <div className="text-sm font-medium">
                            {project.activity_count} activities
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No analytics data available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}