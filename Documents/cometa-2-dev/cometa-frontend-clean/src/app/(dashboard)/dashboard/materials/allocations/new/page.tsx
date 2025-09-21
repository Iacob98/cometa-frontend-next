"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, X, Package, Calculator, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import { useMaterials } from "@/hooks/use-materials";
import { useProjects } from "@/hooks/use-projects";
import { useCrews } from "@/hooks/use-crews";
import { useCreateAllocation } from "@/hooks/use-allocations";

const createAllocationSchema = z.object({
  material_id: z.string().min(1, "Material is required"),
  allocation_type: z.enum(["project", "crew"], {
    required_error: "Please select allocation type",
  }),
  project_id: z.string().optional(),
  crew_id: z.string().optional(),
  allocated_qty: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
  allocation_date: z.string().min(1, "Allocation date is required"),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.allocation_type === "project" && !data.project_id) {
    return false;
  }
  if (data.allocation_type === "crew" && !data.crew_id) {
    return false;
  }
  return true;
}, {
  message: "Please select a target for allocation",
  path: ["allocation_type"],
});

type CreateAllocationFormData = z.infer<typeof createAllocationSchema>;

export default function NewAllocationPage() {
  const router = useRouter();
  const createAllocation = useCreateAllocation();
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const { data: materials } = useMaterials({ per_page: 1000 });
  const { data: projects } = useProjects({ status: "active" });
  const { data: crews } = useCrews();

  const form = useForm<CreateAllocationFormData>({
    resolver: zodResolver(createAllocationSchema),
    defaultValues: {
      material_id: "",
      allocation_type: "project",
      project_id: "",
      crew_id: "",
      allocated_qty: 0,
      allocation_date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const watchedValues = form.watch();
  const { allocated_qty, allocation_type } = watchedValues;

  // Find selected material and calculate values
  const material = materials?.items?.find((m) => m.id === watchedValues.material_id);
  const availableQty = material ? (material.current_stock_qty - material.reserved_qty) : 0;
  const totalCost = material && allocated_qty ? allocated_qty * material.default_price_eur : 0;
  const remainingStock = availableQty - (allocated_qty || 0);

  const handleMaterialChange = (materialId: string) => {
    const material = materials?.items?.find((m) => m.id === materialId);
    setSelectedMaterial(material);
    form.setValue("material_id", materialId);
    form.setValue("allocated_qty", 0); // Reset quantity when material changes
  };

  const handleCreateAllocation = async (data: CreateAllocationFormData) => {
    try {
      const allocationData = {
        material_id: data.material_id,
        project_id: data.allocation_type === "project" ? data.project_id : undefined,
        crew_id: data.allocation_type === "crew" ? data.crew_id : undefined,
        allocated_qty: data.allocated_qty,
        allocation_date: data.allocation_date,
        notes: data.notes,
        allocated_by: "current-user-id", // TODO: Get from auth context
      };

      await createAllocation.mutateAsync(allocationData);
      router.push("/dashboard/materials/allocations");
    } catch (error) {
      console.error("Failed to create allocation:", error);
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Create Material Allocation</h1>
            <p className="text-muted-foreground">
              Allocate materials from warehouse to projects or crews
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Allocation Details</span>
              </CardTitle>
              <CardDescription>
                Select material and target for allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateAllocation)} className="space-y-6">
                  {/* Material Selection */}
                  <FormField
                    control={form.control}
                    name="material_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material *</FormLabel>
                        <Select onValueChange={handleMaterialChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {materials?.items
                              ?.filter((material) => (material.current_stock_qty - material.reserved_qty) > 0)
                              ?.map((material) => {
                                const available = material.current_stock_qty - material.reserved_qty;
                                return (
                                  <SelectItem key={material.id} value={material.id}>
                                    <div className="flex justify-between items-center w-full">
                                      <span>{material.name}</span>
                                      <span className="text-sm text-muted-foreground ml-2">
                                        {available.toFixed(2)} {material.unit} available
                                      </span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Material Info */}
                  {material && (
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Material Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Unit:</span> {material.unit}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span> €{material.default_price_eur.toFixed(2)}/{material.unit}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Available:</span> {availableQty.toFixed(2)} {material.unit}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span> {material.category}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name="allocated_qty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity to Allocate *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            max={availableQty}
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum available: {availableQty.toFixed(3)} {material?.unit || 'units'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Allocation Type */}
                  <FormField
                    control={form.control}
                    name="allocation_type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Allocate to *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="project" id="project" />
                              <Label htmlFor="project">Project</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="crew" id="crew" />
                              <Label htmlFor="crew">Crew</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Target Selection */}
                  {allocation_type === "project" && (
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
                              {projects?.items?.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  <div className="flex flex-col">
                                    <span>{project.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {project.city} • {project.status}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {allocation_type === "crew" && (
                    <FormField
                      control={form.control}
                      name="crew_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crew *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select crew" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {crews?.map((crew) => (
                                <SelectItem key={crew.id} value={crew.id}>
                                  <div className="flex flex-col">
                                    <span>{crew.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {crew.member_count} members • {crew.project_name || 'No project assigned'}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Allocation Date */}
                  <FormField
                    control={form.control}
                    name="allocation_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allocation Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes about this allocation..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createAllocation.isPending || !material || allocated_qty <= 0}
                    >
                      {createAllocation.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Create Allocation
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Calculation Summary */}
          {material && allocated_qty > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Allocation Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Material:</span>
                    <span className="text-sm font-medium">{material.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Quantity:</span>
                    <span className="text-sm font-medium">{allocated_qty} {material.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Unit Price:</span>
                    <span className="text-sm font-medium">€{material.default_price_eur.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total Cost:</span>
                      <span className="text-sm font-bold">€{totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Stock Impact</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Available:</span>
                      <span>{availableQty.toFixed(2)} {material.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">After Allocation:</span>
                      <span className={remainingStock < 0 ? "text-red-600 font-medium" : ""}>
                        {remainingStock.toFixed(2)} {material.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {remainingStock < 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800 font-medium">Insufficient Stock</span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      The requested quantity exceeds available stock.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium">Material Selection</h4>
                <p className="text-muted-foreground">
                  Only materials with available stock are shown in the dropdown.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Allocation Type</h4>
                <p className="text-muted-foreground">
                  Choose between allocating to a specific project or crew for better tracking.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Stock Tracking</h4>
                <p className="text-muted-foreground">
                  Allocated materials are automatically reserved and deducted from available stock.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}