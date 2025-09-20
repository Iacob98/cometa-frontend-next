"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/use-projects";
import { useCurrentUser } from "@/hooks/use-auth";
import { FolderOpen, ClipboardList, Users, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: stats, isLoading } = useDashboardStats(user?.id);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Projects"
          value={stats?.projects?.active || 0}
          subtitle="Currently in progress"
          icon={FolderOpen}
          color="blue"
        />
        <StatCard
          title="Total Projects"
          value={stats?.projects?.total || 0}
          subtitle="All time projects"
          icon={FolderOpen}
          color="green"
        />
        <StatCard
          title="This Week's Work"
          value={stats?.work?.week_entries || 0}
          subtitle="Work entries logged"
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          title="Meters Completed"
          value={`${stats?.work?.week_meters || 0}m`}
          subtitle="This week progress"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates from your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500 mt-2">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <QuickActionButton
                title="Create New Project"
                description="Start a new construction project"
                href="/dashboard/projects/new"
                icon={FolderOpen}
                roles={["admin", "pm"]}
                userRole={user?.role}
              />
              <QuickActionButton
                title="Log Work Entry"
                description="Record today's progress"
                href="/dashboard/work-entries/new"
                icon={ClipboardList}
                roles={["crew", "worker", "foreman"]}
                userRole={user?.role}
              />
              <QuickActionButton
                title="Manage Teams"
                description="Assign team members"
                href="/dashboard/teams"
                icon={Users}
                roles={["admin", "pm", "foreman"]}
                userRole={user?.role}
              />
              <QuickActionButton
                title="View Reports"
                description="Check project analytics"
                href="/dashboard/reports"
                icon={TrendingUp}
                roles={["admin", "pm", "foreman", "viewer"]}
                userRole={user?.role}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-green-500" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-900">All systems operational</span>
            </div>
            <span className="text-xs text-gray-500">Last updated: {new Date().toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange";
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionButtonProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  userRole?: string;
}

function QuickActionButton({ title, description, href, icon: Icon, roles, userRole }: QuickActionButtonProps) {
  if (!userRole || !roles.includes(userRole)) {
    return null;
  }

  return (
    <a
      href={href}
      className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      <div className="flex-shrink-0">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </a>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}