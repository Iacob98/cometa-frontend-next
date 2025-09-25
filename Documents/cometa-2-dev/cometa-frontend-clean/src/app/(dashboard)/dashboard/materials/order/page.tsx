"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Package, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useCreateMaterialOrderWithBudget } from "@/hooks/use-material-orders";
import { useProjects } from "@/hooks/use-projects";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useSupplierMaterials } from "@/hooks/use-suppliers";
import type { CreateMaterialOrderRequest } from "@/types";

const createOrderSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  supplier_id: z.string().min(1, "Supplier is required"),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
  deduct_from_budget: z.boolean().default(true),
  items: z.array(z.object({
    material_id: z.string().min(1, "Material is required"),
    quantity: z.coerce.number().positive("Quantity must be positive"),
    unit_cost: z.coerce.number().positive("Unit cost must be positive").optional(),
  })).min(1, "At least one item is required"),
});

type CreateOrderFormData = z.infer<typeof createOrderSchema>;

export default function OrderMaterialsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project_id') || '';

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const createOrder = useCreateMaterialOrderWithBudget();
  const { data: projectsResponse } = useProjects();
  const { data: suppliers = [] } = useSuppliers();
  const { data: supplierMaterials = [] } = useSupplierMaterials(selectedSupplierId);

  const projects = projectsResponse?.items || [];

  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      project_id: initialProjectId,
      supplier_id: "",
      expected_delivery_date: "",
      notes: "",
      deduct_from_budget: true,
      items: [{ material_id: "", quantity: 1, unit_cost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedSupplierId = form.watch("supplier_id");

  // Update selected supplier when form changes
  if (watchedSupplierId !== selectedSupplierId) {
    setSelectedSupplierId(watchedSupplierId);
    // Clear existing items when supplier changes
    if (selectedSupplierId && watchedSupplierId !== selectedSupplierId) {
      form.setValue("items", [{ material_id: "", quantity: 1, unit_cost: 0 }]);
    }
  }

  const handleCreateOrder = async (data: CreateOrderFormData) => {
    try {
      const orderData: CreateMaterialOrderRequest & { deduct_from_budget?: boolean } = {
        project_id: data.project_id,
        supplier_id: data.supplier_id,
        expected_delivery_date: data.expected_delivery_date || undefined,
        notes: data.notes || undefined,
        deduct_from_budget: data.deduct_from_budget,
        items: data.items.map(item => ({
          material_id: item.material_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost || undefined,
        })),
      };

      await createOrder.mutateAsync(orderData);
      router.push("/dashboard/materials");
    } catch (error) {
      console.error("Failed to create order:", error);
    }
  };

  const addItem = () => {
    append({ material_id: "", quantity: 1, unit_cost: 0 });
  };

  const calculateTotal = () => {
    const items = form.getValues("items");
    return items.reduce((total, item) => {
      return total + (item.quantity * (item.unit_cost || 0));
    }, 0);
  };

  const selectedProject = projects.find(p => p.id === form.watch("project_id"));
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

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
            <h1 className="text-3xl font-bold tracking-tight">Order Materials</h1>
            <p className="text-muted-foreground">
              Create a material order for your project
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
                <ShoppingCart className="h-5 w-5" />
                <span>Order Details</span>
              </CardTitle>
              <CardDescription>
                Select project, supplier, and materials to order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateOrder)} className="space-y-6">
                  {/* Project and Supplier Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  {project.name}
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
                      name="supplier_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select supplier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.org_name}
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
                      name="expected_delivery_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Delivery Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Materials List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Materials</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addItem}
                        disabled={!selectedSupplierId}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>

                    {!selectedSupplierId && (
                      <div className="text-center py-8 text-muted-foreground">
                        Please select a supplier to add materials
                      </div>
                    )}

                    {selectedSupplierId && supplierMaterials.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No materials available from this supplier
                      </div>
                    )}

                    {selectedSupplierId && supplierMaterials.length > 0 && (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit Cost (€)</TableHead>
                              <TableHead>Total (€)</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fields.map((field, index) => {
                              const selectedMaterial = supplierMaterials.find(
                                m => m.id === form.watch(`items.${index}.material_id`)
                              );
                              const quantity = form.watch(`items.${index}.quantity`) || 0;
                              const unitCost = form.watch(`items.${index}.unit_cost`) || selectedMaterial?.unit_price_eur || 0;
                              const total = quantity * unitCost;

                              return (
                                <TableRow key={field.id}>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.material_id`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <Select onValueChange={(value) => {
                                            field.onChange(value);
                                            // Auto-fill unit cost from supplier material
                                            const material = supplierMaterials.find(m => m.id === value);
                                            if (material) {
                                              form.setValue(`items.${index}.unit_cost`, material.unit_price_eur);
                                            }
                                          }} value={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select material" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {supplierMaterials.map((material) => (
                                                <SelectItem key={material.id} value={material.id}>
                                                  <div className="flex flex-col">
                                                    <span>{material.material_type}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                      €{material.unit_price_eur}/{material.unit}
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
                                    {selectedMaterial && (
                                      <div className="mt-1 text-xs text-muted-foreground">
                                        Unit: {selectedMaterial.unit}
                                        {selectedMaterial.min_order_quantity > 1 && (
                                          <span className="ml-1">
                                            (Min: {selectedMaterial.min_order_quantity})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.quantity`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              step="0.001"
                                              min={selectedMaterial?.min_order_quantity || 1}
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.unit_cost`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              min="0"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-medium">
                                      €{total.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {fields.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(index)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes for this order..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget Deduction */}
                  <FormField
                    control={form.control}
                    name="deduct_from_budget"
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
                            Automatically deduct from project budget
                          </FormLabel>
                          <FormDescription>
                            When enabled, the order cost will be automatically deducted from the project's budget as an expense transaction. You can manage this manually later if disabled.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                      ) : (
                        <Package className="mr-2 h-4 w-4" />
                      )}
                      Create Order
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProject && (
                <div>
                  <h4 className="font-medium text-sm">Project</h4>
                  <p className="text-sm text-muted-foreground">{selectedProject.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedProject.customer}</p>
                </div>
              )}

              {selectedSupplier && (
                <div>
                  <h4 className="font-medium text-sm">Supplier</h4>
                  <p className="text-sm text-muted-foreground">{selectedSupplier.org_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedSupplier.contact_person}</p>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Cost</span>
                  <span className="text-lg font-bold">€{calculateTotal().toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Excludes delivery costs
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium">Order Process</h4>
                <p className="text-muted-foreground">
                  Orders are created with "pending" status and can be tracked through delivery
                </p>
              </div>
              <div>
                <h4 className="font-medium">Costs</h4>
                <p className="text-muted-foreground">
                  Order costs will be deducted from the project budget automatically
                </p>
              </div>
              <div>
                <h4 className="font-medium">Delivery</h4>
                <p className="text-muted-foreground">
                  Check with supplier for delivery costs and minimum order requirements
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}