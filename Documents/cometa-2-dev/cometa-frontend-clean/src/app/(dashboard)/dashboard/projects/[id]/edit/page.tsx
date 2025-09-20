"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, ArrowLeft, Save, Building2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useProject, useUpdateProject } from "@/hooks/use-projects";
import { usePermissions } from "@/hooks/use-auth";
import type { UpdateProjectRequest, Language } from "@/types";

const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255, "Project name too long"),
  customer: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  contact_24h: z.string().optional(),
  start_date: z.string().optional(),
  end_date_plan: z.string().optional(),
  total_length_m: z.coerce.number().min(0, "Length must be positive"),
  base_rate_per_m: z.coerce.number().min(0, "Rate must be positive"),
  language_default: z.enum(["ru", "en", "de", "uz", "tr"]),
  status: z.enum(["draft", "active", "waiting_invoice", "closed"]),
});

type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { canManageProjects } = usePermissions();
  const updateProject = useUpdateProject();

  const projectId = params.id as string;
  const { data: project, isLoading, error } = useProject(projectId);

  const form = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: "",
      customer: "",
      city: "",
      address: "",
      contact_24h: "",
      start_date: "",
      end_date_plan: "",
      total_length_m: 0,
      base_rate_per_m: 15.5,
      language_default: "de",
      status: "draft",
    },
  });

  // Update form when project data loads
  if (project && !form.formState.isDirty) {
    form.reset({
      name: project.name,
      customer: project.customer || "",
      city: project.city || "",
      address: project.address || "",
      contact_24h: project.contact_24h || "",
      start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : "",
      end_date_plan: project.end_date_plan ? new Date(project.end_date_plan).toISOString().split('T')[0] : "",
      total_length_m: project.total_length_m,
      base_rate_per_m: project.base_rate_per_m,
      language_default: project.language_default || "de",
      status: project.status,
    });
  }

  const onSubmit = async (data: UpdateProjectFormData) => {
    try {
      const projectData: UpdateProjectRequest = {
        ...data,
        start_date: data.start_date || undefined,
        end_date_plan: data.end_date_plan || undefined,
      };

      await updateProject.mutateAsync({ id: projectId, data: projectData });
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const languages: { value: Language; label: string }[] = [
    { value: "de", label: "German (Deutsch)" },
    { value: "en", label: "English" },
    { value: "ru", label: "Russian (Русский)" },
    { value: "uz", label: "Uzbek (Oʻzbek)" },
    { value: "tr", label: "Turkish (Türkçe)" },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "waiting_invoice", label: "Waiting Invoice" },
    { value: "closed", label: "Closed" },
  ];

  if (!canManageProjects) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Access Denied</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You don&apos;t have permission to edit projects.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="max-w-2xl space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Project not found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </p>
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
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
            <p className="text-muted-foreground">
              Modify project details and configuration
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription>
                  Update the fundamental details about the project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Fiber Installation Berlin District 1"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A clear, descriptive name for the project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Deutsche Telekom"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Berlin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Hauptstraße 123, 10115 Berlin"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Primary address or area where the work will be performed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_24h"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>24h Emergency Contact</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., +49 30 12345678"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Contact number for emergencies during the project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="language_default"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Primary language used for project documentation and interface
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Current status of the project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Project Scope */}
            <Card>
              <CardHeader>
                <CardTitle>Project Scope</CardTitle>
                <CardDescription>
                  Update the scope and financial parameters of the project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="total_length_m"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Length (meters) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 1500"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Total length of fiber cable to be installed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="base_rate_per_m"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate per Meter (€) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 15.50"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Base rate charged per meter of installation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Calculated Total */}
                <div className="rounded-md bg-muted p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Estimated Project Value:</span>
                    <span className="text-lg font-bold">
                      €{(form.watch("total_length_m") * form.watch("base_rate_per_m")).toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {form.watch("total_length_m")} meters × €{form.watch("base_rate_per_m")} per meter
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>Project Timeline</span>
                </CardTitle>
                <CardDescription>
                  Update the planned start and end dates (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProject.isPending}
                className="flex items-center space-x-2"
              >
                {updateProject.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}