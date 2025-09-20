"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  MapPin,
  Ruler,
  Camera,
  FileText,
  Building2,
  Users,
  Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCreateWorkEntry, useWorkStages } from "@/hooks/use-work-entries";
import { useProjects } from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import type { CreateWorkEntryRequest, StageCode, WorkMethod } from "@/types";

const createWorkEntrySchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  stage_code: z.enum([
    "stage_1_marking",
    "stage_2_excavation",
    "stage_3_conduit",
    "stage_4_cable_pulling",
    "stage_5_closure",
    "stage_6_testing",
    "stage_7_backfill",
    "stage_8_restoration",
    "stage_9_documentation",
    "stage_10_quality_check"
  ]),
  meters_done_m: z.coerce.number().min(0, "Meters must be positive"),
  method: z.enum(["manual", "machine", "mixed"]).optional(),
  width_m: z.coerce.number().min(0).optional(),
  depth_m: z.coerce.number().min(0).optional(),
  cables_count: z.coerce.number().min(0).optional(),
  has_protection_pipe: z.boolean().optional(),
  soil_type: z.string().optional(),
  notes: z.string().optional(),
  cabinet_id: z.string().optional(),
  segment_id: z.string().optional(),
  cut_id: z.string().optional(),
  house_id: z.string().optional(),
  crew_id: z.string().optional(),
});

type CreateWorkEntryFormData = z.infer<typeof createWorkEntrySchema>;

export default function NewWorkEntryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createWorkEntry = useCreateWorkEntry();

  const { data: projectsResponse } = useProjects({ page: 1, per_page: 100 });
  const { data: stages } = useWorkStages();

  const projects = projectsResponse?.items || [];

  const form = useForm<CreateWorkEntryFormData>({
    resolver: zodResolver(createWorkEntrySchema),
    defaultValues: {
      project_id: "",
      stage_code: "stage_1_marking",
      meters_done_m: 0,
      method: "manual",
      width_m: undefined,
      depth_m: undefined,
      cables_count: undefined,
      has_protection_pipe: false,
      soil_type: "",
      notes: "",
      cabinet_id: "",
      segment_id: "",
      cut_id: "",
      house_id: "",
      crew_id: "",
    },
  });

  const selectedStage = form.watch("stage_code");

  const onSubmit = async (data: CreateWorkEntryFormData) => {
    try {
      const workEntryData: CreateWorkEntryRequest = {
        ...data,
        // Remove empty string values
        cabinet_id: data.cabinet_id || undefined,
        segment_id: data.segment_id || undefined,
        cut_id: data.cut_id || undefined,
        house_id: data.house_id || undefined,
        crew_id: data.crew_id || undefined,
        width_m: data.width_m || undefined,
        depth_m: data.depth_m || undefined,
        cables_count: data.cables_count || undefined,
        soil_type: data.soil_type || undefined,
        notes: data.notes || undefined,
        method: data.method || undefined,
      };

      const newWorkEntry = await createWorkEntry.mutateAsync(workEntryData);
      router.push(`/dashboard/work-entries/${newWorkEntry.id}`);
    } catch (error) {
      console.error("Failed to create work entry:", error);
    }
  };

  const stageOptions = [
    { value: "stage_1_marking", label: "1. Marking" },
    { value: "stage_2_excavation", label: "2. Excavation" },
    { value: "stage_3_conduit", label: "3. Conduit Installation" },
    { value: "stage_4_cable_pulling", label: "4. Cable Pulling" },
    { value: "stage_5_closure", label: "5. Closure" },
    { value: "stage_6_testing", label: "6. Testing" },
    { value: "stage_7_backfill", label: "7. Backfilling" },
    { value: "stage_8_restoration", label: "8. Surface Restoration" },
    { value: "stage_9_documentation", label: "9. Documentation" },
    { value: "stage_10_quality_check", label: "10. Quality Check" },
  ];

  const methodOptions = [
    { value: "manual", label: "Manual" },
    { value: "machine", label: "Machine" },
    { value: "mixed", label: "Mixed" },
  ];

  // Show different fields based on stage
  const showMeasurements = ["stage_2_excavation", "stage_3_conduit"].includes(selectedStage);
  const showCables = ["stage_3_conduit", "stage_4_cable_pulling"].includes(selectedStage);
  const showSoilType = selectedStage === "stage_2_excavation";

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
            <h1 className="text-3xl font-bold tracking-tight">Create Work Entry</h1>
            <p className="text-muted-foreground">
              Record field work progress and measurements
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="measurements">Measurements</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="notes">Notes & Photos</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5" />
                      <span>Basic Information</span>
                    </CardTitle>
                    <CardDescription>
                      Essential details about the work performed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="project_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name} - {project.city}
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
                        name="stage_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Stage *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select work stage" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stageOptions.map((stage) => (
                                  <SelectItem key={stage.value} value={stage.value}>
                                    {stage.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the type of work performed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="meters_done_m"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meters Completed *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="e.g., 25.5"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Length of work completed in meters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {methodOptions.map((method) => (
                                  <SelectItem key={method.value} value={method.value}>
                                    {method.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How the work was performed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="measurements" className="space-y-6">
                {/* Measurements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Ruler className="h-5 w-5" />
                      <span>Measurements & Technical Details</span>
                    </CardTitle>
                    <CardDescription>
                      Technical specifications and measurements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {showMeasurements && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="width_m"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Width (meters)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="e.g., 0.30"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Width of excavation or installation
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="depth_m"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Depth (meters)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="e.g., 0.80"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Depth of excavation or installation
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {showCables && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="cables_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Cables</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="e.g., 4"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Number of cables installed or pulled
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="has_protection_pipe"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Protection Pipe Installed
                                </FormLabel>
                                <FormDescription>
                                  Check if protection pipe was used
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {showSoilType && (
                      <FormField
                        control={form.control}
                        name="soil_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Soil Type</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Clay, Sand, Rock"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Description of soil conditions encountered
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location" className="space-y-6">
                {/* Location Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Location & Assignment</span>
                    </CardTitle>
                    <CardDescription>
                      Specific location and team assignment details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="cabinet_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cabinet ID</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., CAB-001" {...field} />
                            </FormControl>
                            <FormDescription>
                              Network cabinet identifier (if applicable)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="segment_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segment ID</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., SEG-A1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Cable segment identifier (if applicable)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="cut_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cut ID</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., CUT-001" {...field} />
                            </FormControl>
                            <FormDescription>
                              Excavation cut identifier (if applicable)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="house_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>House ID</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., H-123" {...field} />
                            </FormControl>
                            <FormDescription>
                              House connection identifier (if applicable)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="crew_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crew Assignment</FormLabel>
                          <FormControl>
                            <Input placeholder="Crew ID (if different from current)" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave empty to use your current crew assignment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-6">
                {/* Notes and Photos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Additional Information</span>
                    </CardTitle>
                    <CardDescription>
                      Notes, observations, and documentation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes & Observations</FormLabel>
                          <FormControl>
                            <textarea
                              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Any additional notes, observations, or issues encountered..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional notes about the work performed, conditions, or issues
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="rounded-md border border-dashed border-gray-300 p-6">
                      <div className="text-center">
                        <Camera className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold">Photo Upload</h3>
                          <p className="text-sm text-muted-foreground">
                            Photos can be uploaded after creating the work entry
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

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
                disabled={createWorkEntry.isPending}
                className="flex items-center space-x-2"
              >
                {createWorkEntry.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Create Work Entry</span>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}