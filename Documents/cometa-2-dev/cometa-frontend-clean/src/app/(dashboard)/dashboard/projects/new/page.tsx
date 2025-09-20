"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, ArrowLeft, Save, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useCreateProject } from "@/hooks/use-projects";
import { requireAuth } from "@/lib/auth";
import type { CreateProjectRequest, Language } from "@/types";

// Validation schema
const createProjectSchema = z.object({
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
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export default function NewProjectPage() {
  // Require authentication
  requireAuth();

  const router = useRouter();
  const createProject = useCreateProject();

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      customer: "",
      city: "",
      address: "",
      contact_24h: "",
      start_date: "",
      end_date_plan: "",
      total_length_m: 0,
      base_rate_per_m: 15.5, // Default rate
      language_default: "de", // Default to German
    },
  });

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      const projectData: CreateProjectRequest = {
        ...data,
        start_date: data.start_date || undefined,
        end_date_plan: data.end_date_plan || undefined,
      };

      const newProject = await createProject.mutateAsync(projectData);
      router.push(`/dashboard/projects/${newProject.id}`);
    } catch (error) {
      // Error is handled by the mutation
      console.error("Failed to create project:", error);
    }
  };

  const languages: { value: Language; label: string }[] = [
    { value: "de", label: "German (Deutsch)" },
    { value: "en", label: "English" },
    { value: "ru", label: "Russian (Русский)" },
    { value: "uz", label: "Uzbek (Oʻzbek)" },
    { value: "tr", label: "Turkish (Türkçe)" },
  ];

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
            <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
            <p className="text-muted-foreground">
              Set up a new fiber optic construction project
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
                  Enter the fundamental details about the project
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

                <FormField
                  control={form.control}
                  name="language_default"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </CardContent>
            </Card>

            {/* Project Scope */}
            <Card>
              <CardHeader>
                <CardTitle>Project Scope</CardTitle>
                <CardDescription>
                  Define the scope and financial parameters of the project
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
                  Set the planned start and end dates (optional)
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
                disabled={createProject.isPending}
                className="flex items-center space-x-2"
              >
                {createProject.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Create Project</span>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}