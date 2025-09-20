"use client";

import React, { useState } from "react";
import { Bell, Settings, Filter, Plus, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { NotificationItem } from "@/components/notifications/notification-item";
import {
  useUserNotifications,
  useUnreadNotifications,
  useUrgentNotifications,
  useRecentNotifications,
  useUnreadNotificationCount,
  useNotificationActions,
} from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/lib/websocket-provider";
import type { NotificationPriority, NotificationType } from "@/types";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | "all">("all");
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const { markAllAsRead, isLoading: actionLoading } = useNotificationActions();

  // Fetch notifications based on active tab
  const { data: allNotifications, isLoading: allLoading } = useUserNotifications(user?.id || "");
  const { data: unreadNotifications, isLoading: unreadLoading } = useUnreadNotifications(user?.id || "");
  const { data: urgentNotifications, isLoading: urgentLoading } = useUrgentNotifications(user?.id || "");
  const { data: recentNotifications, isLoading: recentLoading } = useRecentNotifications(user?.id || "");
  const { data: unreadCount } = useUnreadNotificationCount(user?.id || "");

  const getCurrentNotifications = () => {
    switch (activeTab) {
      case "unread":
        return { data: unreadNotifications, isLoading: unreadLoading };
      case "urgent":
        return { data: urgentNotifications, isLoading: urgentLoading };
      case "recent":
        return { data: recentNotifications, isLoading: recentLoading };
      default:
        return { data: allNotifications, isLoading: allLoading };
    }
  };

  const { data: currentNotifications, isLoading } = getCurrentNotifications();
  let notifications = currentNotifications?.items || [];

  // Apply filters
  if (searchQuery) {
    notifications = notifications.filter(
      (notification) =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.body.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (filterPriority !== "all") {
    notifications = notifications.filter((notification) => notification.priority === filterPriority);
  }

  if (filterType !== "all") {
    notifications = notifications.filter((notification) => notification.type === filterType);
  }

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsRead(user.id);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Manage your notifications and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? "Real-time connected" : "Offline"}
            </span>
          </div>

          <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Notification Preferences</DialogTitle>
                <DialogDescription>
                  Manage how and when you receive notifications.
                </DialogDescription>
              </DialogHeader>
              <NotificationPreferences userId={user?.id || ""} />
            </DialogContent>
          </Dialog>

          {unreadCount && unreadCount.count > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark All Read ({unreadCount.count})
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allNotifications?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount?.count || 0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount?.count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <Badge variant="destructive" className="h-4 w-4 rounded-full p-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentNotifications?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent (24h)</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentNotifications?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as NotificationPriority | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(value) => setFilterType(value as NotificationType | "all")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="work_entry_created">Work Entry Created</SelectItem>
                <SelectItem value="work_entry_approved">Work Entry Approved</SelectItem>
                <SelectItem value="project_status_changed">Project Status</SelectItem>
                <SelectItem value="material_low_stock">Low Stock</SelectItem>
                <SelectItem value="deadline_reminder">Deadline</SelectItem>
                <SelectItem value="approval_required">Approval Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All
                {allNotifications?.total && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {allNotifications.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount && unreadCount.count > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 text-xs">
                    {unreadCount.count}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="urgent">
                Urgent
                {urgentNotifications?.total && urgentNotifications.total > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 text-xs">
                    {urgentNotifications.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No notifications found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterPriority !== "all" || filterType !== "all"
                  ? "Try adjusting your filters"
                  : "You&apos;re all caught up!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}