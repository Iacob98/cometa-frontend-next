"use client";

import React, { useState } from "react";
import { Bell, Check, X, Settings, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUnreadNotificationCount,
  useUserNotifications,
  useUnreadNotifications,
  useUrgentNotifications,
  useNotificationActions,
  useWebSocketNotifications,
} from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { NotificationItem } from "./notification-item";
import { NotificationPreferences } from "./notification-preferences";
import { formatDistanceToNow } from "date-fns";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();

  const { data: unreadCount } = useUnreadNotificationCount(user?.id || "");
  const { data: allNotifications, isLoading: allLoading } = useUserNotifications(user?.id || "");
  const { data: unreadNotifications, isLoading: unreadLoading } = useUnreadNotifications(user?.id || "");
  const { data: urgentNotifications, isLoading: urgentLoading } = useUrgentNotifications(user?.id || "");

  const { markAllAsRead, isLoading: actionLoading } = useNotificationActions();

  // Enable WebSocket for real-time notifications
  useWebSocketNotifications(user?.id || "", !!user?.id);

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsRead(user.id);
    }
  };

  const getNotificationsForTab = () => {
    switch (activeTab) {
      case "unread":
        return { data: unreadNotifications, isLoading: unreadLoading };
      case "urgent":
        return { data: urgentNotifications, isLoading: urgentLoading };
      default:
        return { data: allNotifications, isLoading: allLoading };
    }
  };

  const { data: currentNotifications, isLoading } = getNotificationsForTab();
  const notifications = currentNotifications?.items || [];

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount && unreadCount.count > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount.count > 99 ? "99+" : unreadCount.count}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center gap-2">
              <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
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
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={actionLoading}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="p-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="text-xs">
                  All
                  {allNotifications?.total && (
                    <Badge variant="secondary" className="ml-1 h-4 text-xs">
                      {allNotifications.total}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Unread
                  {unreadCount && unreadCount.count > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 text-xs">
                      {unreadCount.count}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="urgent" className="text-xs">
                  Urgent
                  {urgentNotifications?.total && urgentNotifications.total > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 text-xs">
                      {urgentNotifications.total}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-2">
                <ScrollArea className="h-96">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClose={() => setIsOpen(false)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Notifications
                </Button>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}