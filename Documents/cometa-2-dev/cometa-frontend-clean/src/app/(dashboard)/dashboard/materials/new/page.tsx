"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, X, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useCreateMaterial } from "@/hooks/use-materials";
import type { MaterialUnit } from "@/types";

const createMaterialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  sku: z.string().optional(),
  default_price_eur: z.coerce.number().min(0, "Price must be non-negative").optional(),
  purchase_price_eur: z.coerce.number().min(0, "Purchase price must be non-negative").optional(),
  initial_stock: z.coerce.number().min(0, "Initial stock must be non-negative").optional(),
  min_stock_level: z.coerce.number().min(0, "Minimum stock level must be non-negative").optional(),
});

type CreateMaterialFormData = z.infer<typeof createMaterialSchema>;

const materialUnits: { value: MaterialUnit; label: string }[] = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "m", label: "Meters (m)" },
  { value: "m2", label: "Square meters (m²)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "t", label: "Tons (t)" },
  { value: "l", label: "Liters (L)" },
  { value: "m3", label: "Cubic meters (m³)" },
  { value: "roll", label: "Rolls" },
  { value: "other", label: "Other" },
];

export default function NewMaterialPage() {
  const router = useRouter();
  const createMaterial = useCreateMaterial();

  const form = useForm<CreateMaterialFormData>({
    resolver: zodResolver(createMaterialSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "",
      sku: "",
      default_price_eur: 0,
      purchase_price_eur: 0,
      initial_stock: 0,
      min_stock_level: 0,
    },
  });

  const handleCreateMaterial = async (data: CreateMaterialFormData) => {
    try {
      await createMaterial.mutateAsync(data);
      router.push("/dashboard/materials");
    } catch (error) {
      console.error("Failed to create material:", error);
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
            <h1 className="text-3xl font-bold tracking-tight">Create New Material</h1>
            <p className="text-muted-foreground">
              Add a new material to your inventory system
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
                <span>Material Information</span>
              </CardTitle>
              <CardDescription>
                Enter the basic information for the new material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateMaterial)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Material Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Single Mode Fiber Cable 12-strand"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., FOC-SM-12"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Stock Keeping Unit (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit of Measurement *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {materialUnits.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label}
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
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of the material, specifications, etc."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-4">Pricing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="purchase_price_eur"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Purchase Price (EUR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Cost price from supplier
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="default_price_eur"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selling Price (EUR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Default selling price
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-4">Inventory</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="initial_stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Initial Stock Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  placeholder="0"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Starting inventory amount
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="min_stock_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Stock Level</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  placeholder="0"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Alert when stock falls below this level
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

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
                      disabled={createMaterial.isPending}
                    >
                      {createMaterial.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Create Material
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium">Material Name</h4>
                <p className="text-muted-foreground">
                  Use descriptive names that include key specifications like "Single Mode Fiber Cable 12-strand"
                </p>
              </div>
              <div>
                <h4 className="font-medium">SKU</h4>
                <p className="text-muted-foreground">
                  Create unique identifiers for easy tracking and ordering
                </p>
              </div>
              <div>
                <h4 className="font-medium">Units</h4>
                <p className="text-muted-foreground">
                  Choose the most appropriate unit for purchasing and usage tracking
                </p>
              </div>
              <div>
                <h4 className="font-medium">Pricing</h4>
                <p className="text-muted-foreground">
                  Purchase price helps track costs, selling price is used for project estimates
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">
                Materials are automatically categorized based on their names:
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Cables - Fiber, copper cables</li>
                <li>• Connectors - SC, LC, splice closures</li>
                <li>• Tools - Installation equipment</li>
                <li>• Conduits - Ducts, pipes</li>
                <li>• Equipment - Hardware devices</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}