"use client";

import React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotificationActions } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import type { Notification, NotificationPriority } from "@/types";

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

const priorityConfig: Record<NotificationPriority, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}> = {
  low: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    badgeVariant: "secondary",
  },
  normal: {
    icon: Info,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    badgeVariant: "outline",
  },
  high: {
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    badgeVariant: "default",
  },
  urgent: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    badgeVariant: "destructive",
  },
};

const getNotificationTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    work_entry_created: "Work Entry Created",
    work_entry_approved: "Work Entry Approved",
    work_entry_rejected: "Work Entry Rejected",
    project_status_changed: "Project Status Updated",
    project_assigned: "Project Assigned",
    team_assignment_changed: "Team Assignment",
    material_low_stock: "Low Stock Alert",
    material_order_delivered: "Order Delivered",
    house_appointment_scheduled: "Appointment Scheduled",
    house_connection_completed: "Connection Completed",
    budget_alert: "Budget Alert",
    deadline_reminder: "Deadline Reminder",
    system_maintenance: "System Maintenance",
    user_mention: "Mentioned",
    approval_required: "Approval Required",
  };

  return typeLabels[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead, delete: deleteNotification } = useNotificationActions();

  const config = priorityConfig[notification.priority];
  const Icon = config.icon;
  const isUnread = !notification.read_at;

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnread) {
      markAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  const handleClick = () => {
    if (isUnread) {
      markAsRead(notification.id);
    }

    // Handle navigation based on notification type and data
    if (notification.data) {
      const { project_id, work_entry_id, house_id, material_id } = notification.data;

      if (project_id) {
        // Navigate to project detail
        window.location.href = `/dashboard/projects/${project_id}`;
      } else if (work_entry_id) {
        // Navigate to work entry detail
        window.location.href = `/dashboard/work-entries/${work_entry_id}`;
      } else if (house_id) {
        // Navigate to house detail
        window.location.href = `/dashboard/houses/${house_id}`;
      } else if (material_id) {
        // Navigate to material detail
        window.location.href = `/dashboard/materials/${material_id}`;
      }
    }

    onClose?.();
  };

  return (
    <div
      className={cn(
        "group relative p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
        isUnread && "border-l-4 border-l-primary bg-primary/5",
        !isUnread && "opacity-75"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-full p-1", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant={config.badgeVariant} className="text-xs">
              {getNotificationTypeLabel(notification.type)}
            </Badge>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
              {isUnread && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          </div>

          <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
            {notification.title}
          </h4>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.body}
          </p>

          {/* Additional metadata */}
          {notification.data && (
            <div className="mt-2 flex flex-wrap gap-1">
              {notification.data.project_name && (
                <Badge variant="outline" className="text-xs">
                  {notification.data.project_name}
                </Badge>
              )}
              {notification.data.user_name && (
                <Badge variant="outline" className="text-xs">
                  {notification.data.user_name}
                </Badge>
              )}
              {notification.data.stage_code && (
                <Badge variant="outline" className="text-xs">
                  {notification.data.stage_code}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="h-6 w-6 p-0"
              title="Mark as read"
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            title="Delete notification"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Expiration indicator */}
      {notification.expires_at && new Date(notification.expires_at) < new Date() && (
        <div className="absolute top-1 right-1">
          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
            Expired
          </Badge>
        </div>
      )}
    </div>
  );
}