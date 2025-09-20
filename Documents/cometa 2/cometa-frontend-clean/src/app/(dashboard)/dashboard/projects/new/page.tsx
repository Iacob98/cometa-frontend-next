"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProject } from "@/hooks/use-projects";
import { useCurrentUser } from "@/hooks/use-auth";
import { projectSchema, ProjectFormData } from "@/lib/validations/project";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";

// Mock PM users for development - in production this would come from API
const PROJECT_MANAGERS = [
  { id: "pm1", name: "John Smith", email: "pm1@fiber.com" },
  { id: "pm2", name: "Sarah Johnson", email: "pm2@fiber.com" },
  { id: "pm3", name: "Mike Brown", email: "pm3@fiber.com" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const createProjectMutation = useCreateProject();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      customer: "",
      city: "",
      total_length_m: 0,
      base_rate_per_m: 0,
      pm_user_id: undefined,
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      await createProjectMutation.mutateAsync(data);
      router.push("/dashboard/projects");
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Failed to create project:", error);
    }
  };

  // Check permissions
  if (!user || !["admin", "pm"].includes(user.role)) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to create projects.
        </p>
        <div className="mt-6">
          <Link href="/dashboard/projects">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/projects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600">Set up a new fiber optic construction project</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Enter the basic information for your new project. You can always edit these details later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Project Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Fiber Network Downtown"
                          {...field}
                          disabled={createProjectMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this construction project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Customer */}
                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Deutsche Telekom, O2, Vodafone"
                          {...field}
                          disabled={createProjectMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        The telecommunications company or client
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Berlin, Hamburg, Munich"
                          {...field}
                          disabled={createProjectMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Primary city where construction will take place
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project Specifications */}
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
                            placeholder="e.g., 5000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={createProjectMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Total cable length to be installed
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
                            placeholder="e.g., 25.50"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={createProjectMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Base rate per meter for this project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Project Manager */}
                <FormField
                  control={form.control}
                  name="pm_user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Manager</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger disabled={createProjectMutation.isPending}>
                            <SelectValue placeholder="Select a project manager (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROJECT_MANAGERS.map((pm) => (
                            <SelectItem key={pm.id} value={pm.id}>
                              {pm.name} ({pm.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign a project manager to oversee this project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project Value Calculation */}
                {form.watch("total_length_m") > 0 && form.watch("base_rate_per_m") > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Project Value Estimate</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Total Length</p>
                        <p className="font-medium text-blue-900">
                          {form.watch("total_length_m").toLocaleString()} meters
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Rate per Meter</p>
                        <p className="font-medium text-blue-900">
                          €{form.watch("base_rate_per_m").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Estimated Total</p>
                        <p className="font-medium text-blue-900 text-lg">
                          €{(form.watch("total_length_m") * form.watch("base_rate_per_m")).toLocaleString("de-DE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6">
                  <Link href="/dashboard/projects">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={createProjectMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={createProjectMutation.isPending}
                  >
                    {createProjectMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}