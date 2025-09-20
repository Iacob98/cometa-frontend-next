"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import type {
  NotificationChannel,
  NotificationType,
  NotificationChannelPreference,
} from "@/types";

interface NotificationPreferencesProps {
  userId: string;
}

const notificationChannels: NotificationChannel[] = [
  "websocket",
  "push",
  "email",
  "sms",
  "in_app",
];

const notificationTypes: { type: NotificationType; label: string; description: string }[] = [
  {
    type: "work_entry_created",
    label: "Work Entry Created",
    description: "When a new work entry is submitted",
  },
  {
    type: "work_entry_approved",
    label: "Work Entry Approved",
    description: "When your work entry is approved",
  },
  {
    type: "work_entry_rejected",
    label: "Work Entry Rejected",
    description: "When your work entry is rejected",
  },
  {
    type: "project_status_changed",
    label: "Project Status Changes",
    description: "When project status is updated",
  },
  {
    type: "project_assigned",
    label: "Project Assignment",
    description: "When you&apos;re assigned to a project",
  },
  {
    type: "team_assignment_changed",
    label: "Team Assignment",
    description: "When team assignments change",
  },
  {
    type: "material_low_stock",
    label: "Low Stock Alerts",
    description: "When materials are running low",
  },
  {
    type: "material_order_delivered",
    label: "Order Delivered",
    description: "When material orders are delivered",
  },
  {
    type: "house_appointment_scheduled",
    label: "Appointment Scheduled",
    description: "When house appointments are scheduled",
  },
  {
    type: "house_connection_completed",
    label: "Connection Completed",
    description: "When house connections are completed",
  },
  {
    type: "budget_alert",
    label: "Budget Alerts",
    description: "When budget thresholds are exceeded",
  },
  {
    type: "deadline_reminder",
    label: "Deadline Reminders",
    description: "When project deadlines approach",
  },
  {
    type: "system_maintenance",
    label: "System Maintenance",
    description: "System maintenance notifications",
  },
  {
    type: "user_mention",
    label: "User Mentions",
    description: "When you&apos;re mentioned in comments",
  },
  {
    type: "approval_required",
    label: "Approval Required",
    description: "When your approval is needed",
  },
];

const preferencesSchema = z.object({
  enabled_channels: z.array(z.string()).min(1, "Select at least one channel"),
  notification_types: z.record(
    z.object({
      enabled: z.boolean(),
      channels: z.array(z.string()),
      frequency: z.enum(["immediate", "hourly", "daily", "weekly"]).optional(),
    })
  ),
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const { data: preferences, isLoading } = useNotificationPreferences(userId);
  const updatePreferences = useUpdateNotificationPreferences();

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      enabled_channels: ["websocket", "in_app"],
      notification_types: {},
      quiet_hours_start: "22:00",
      quiet_hours_end: "08:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: "en",
    },
  });

  React.useEffect(() => {
    if (preferences) {
      form.reset({
        enabled_channels: preferences.enabled_channels,
        notification_types: preferences.notification_types,
        quiet_hours_start: preferences.quiet_hours_start || "22:00",
        quiet_hours_end: preferences.quiet_hours_end || "08:00",
        timezone: preferences.timezone,
        language: preferences.language,
      });
    }
  }, [preferences, form]);

  const onSubmit = (data: PreferencesFormData) => {
    updatePreferences.mutate({
      userId,
      data: {
        enabled_channels: data.enabled_channels as NotificationChannel[],
        notification_types: data.notification_types as Record<
          NotificationType,
          NotificationChannelPreference
        >,
        quiet_hours_start: data.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end,
        timezone: data.timezone,
        language: data.language,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="types">Notification Types</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="enabled_channels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enabled Channels</FormLabel>
                      <div className="space-y-3">
                        {notificationChannels.map((channel) => (
                          <div key={channel} className="flex items-center space-x-2">
                            <Switch
                              id={channel}
                              checked={field.value.includes(channel)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, channel]);
                                } else {
                                  field.onChange(
                                    field.value.filter((c) => c !== channel)
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={channel}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                            >
                              {channel.replace("_", " ")}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>
                  Configure which notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notificationTypes.map(({ type, label, description }) => (
                  <div key={type} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">{label}</Label>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                      <FormField
                        control={form.control}
                        name={`notification_types.${type}.enabled`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`notification_types.${type}.frequency`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Frequency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || "immediate"}
                            >
                              <FormControl>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="immediate">Immediate</SelectItem>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`notification_types.${type}.channels`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Channels</FormLabel>
                            <div className="flex flex-wrap gap-1">
                              {form.watch("enabled_channels").map((channel) => (
                                <Label
                                  key={channel}
                                  className="flex items-center space-x-1 text-xs cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    className="w-3 h-3"
                                    checked={
                                      field.value?.includes(channel) || false
                                    }
                                    onChange={(e) => {
                                      const channels = field.value || [];
                                      if (e.target.checked) {
                                        field.onChange([...channels, channel]);
                                      } else {
                                        field.onChange(
                                          channels.filter((c) => c !== channel)
                                        );
                                      }
                                    }}
                                  />
                                  <span className="capitalize">
                                    {channel.replace("_", " ")}
                                  </span>
                                </Label>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure quiet hours and other preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quiet_hours_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiet Hours Start</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>
                          No notifications during quiet hours
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quiet_hours_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiet Hours End</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Intl.supportedValuesOf("timeZone").map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ru">Русский</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="uz">Oʻzbekcha</SelectItem>
                          <SelectItem value="tr">Türkçe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={updatePreferences.isPending}
            className="w-full"
          >
            {updatePreferences.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </Form>
  );
}