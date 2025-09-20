"use client";

import { Building2, Users, ClipboardList, AlertCircle, TrendingUp, Calendar, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user, isAdmin, isProjectManager, isWorker, isForeman } = usePermissions();
  const canCreateWork = isWorker || isForeman || isProjectManager || isAdmin;

  // Mock data - in real app this would come from API
  const stats = {
    activeProjects: 12,
    totalWorkEntries: 347,
    pendingApprovals: 8,
    activeWorkers: 23,
  };

  const recentActivity = [
    {
      id: 1,
      type: "work_entry",
      description: "New excavation work completed on Project Alpha",
      user: "John Doe",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "project",
      description: "Project Beta status changed to Active",
      user: "Jane Smith",
      time: "4 hours ago",
    },
    {
      id: 3,
      type: "approval",
      description: "Work entry approved by foreman",
      user: "Mike Johnson",
      time: "6 hours ago",
    },
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: "Project Alpha - Phase 2 Review",
      dueDate: "Today, 3:00 PM",
      priority: "high",
    },
    {
      id: 2,
      title: "Team Weekly Meeting",
      dueDate: "Tomorrow, 9:00 AM",
      priority: "medium",
    },
    {
      id: 3,
      title: "Equipment Maintenance Check",
      dueDate: "Dec 23, 2024",
      priority: "low",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening in your fiber optic construction projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Entries</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkEntries}</div>
            <p className="text-xs text-muted-foreground">
              +18 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWorkers}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="mt-1">
                    {activity.type === "work_entry" && (
                      <ClipboardList className="h-4 w-4 text-blue-500" />
                    )}
                    {activity.type === "project" && (
                      <Building2 className="h-4 w-4 text-green-500" />
                    )}
                    {activity.type === "approval" && (
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{task.title}</h4>
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "destructive"
                          : task.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{task.dueDate}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you can perform based on your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {canCreateWork && (
              <Button variant="outline">
                <ClipboardList className="mr-2 h-4 w-4" />
                Create Work Entry
              </Button>
            )}
            {(isAdmin || isProjectManager) && (
              <Button variant="outline">
                <Building2 className="mr-2 h-4 w-4" />
                New Project
              </Button>
            )}
            {(isAdmin || isProjectManager) && (
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Teams
              </Button>
            )}
            <Button variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}