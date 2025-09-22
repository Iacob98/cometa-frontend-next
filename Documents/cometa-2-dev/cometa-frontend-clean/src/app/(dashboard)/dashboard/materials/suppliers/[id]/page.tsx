"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Package,
  Users,
  Star,
  Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

import {
  useSupplier,
  useSupplierContacts,
  useSupplierMaterials,
  useSupplierProjects,
  useCreateSupplierContact,
  useDeleteSupplierContact,
  type CreateContactData,
  type SupplierContact,
  type SupplierMaterial,
  type ProjectAssignment
} from "@/hooks/use-suppliers";
import { usePermissions } from "@/hooks/use-auth";

const contactSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required"),
  position: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  is_primary: z.boolean().default(false),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { canManageInventory } = usePermissions();
  const supplierId = params.id as string;

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  const { data: supplier, isLoading } = useSupplier(supplierId);
  const { data: contacts = [], isLoading: contactsLoading } = useSupplierContacts(supplierId);
  const { data: supplierMaterials = [], isLoading: materialsLoading } = useSupplierMaterials(supplierId);
  const { data: assignedProjects = [], isLoading: projectsLoading } = useSupplierProjects(supplierId);

  const createContact = useCreateSupplierContact(supplierId);
  const deleteContact = useDeleteSupplierContact(supplierId);

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact_name: "",
      position: "",
      department: "",
      phone: "",
      email: "",
      is_primary: false,
      notes: "",
    },
  });


  const handleAddContact = async (data: ContactFormData) => {
    try {
      await createContact.mutateAsync(data);
      setIsAddContactOpen(false);
      contactForm.reset();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;

    try {
      await deleteContact.mutateAsync(contactId);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-48"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Supplier not found</h3>
            <p className="text-muted-foreground">The supplier you're looking for doesn't exist.</p>
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
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{supplier.org_name}</h1>
            <p className="text-muted-foreground">Supplier Details & Management</p>
          </div>
        </div>
        {canManageInventory && (
          <div className="flex space-x-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Organization</label>
                      <p className="text-sm">{supplier.org_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
                        {supplier.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
                      <p className="text-sm">{supplier.contact_person}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-sm">{supplier.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{supplier.email || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p className="text-sm">{supplier.address || "Not provided"}</p>
                    </div>
                  </div>
                  {supplier.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <p className="text-sm">{supplier.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Contact Persons</CardTitle>
                    <CardDescription>Manage contacts for this supplier</CardDescription>
                  </div>
                  {canManageInventory && (
                    <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Contact
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Contact</DialogTitle>
                          <DialogDescription>
                            Add a new contact person for {supplier.org_name}
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...contactForm}>
                          <form onSubmit={contactForm.handleSubmit(handleAddContact)} className="space-y-4">
                            <FormField
                              control={contactForm.control}
                              name="contact_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., John Smith" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={contactForm.control}
                                name="position"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Sales Manager" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={contactForm.control}
                                name="department"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Department</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Sales" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={contactForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1234567890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={contactForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input placeholder="contact@company.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={contactForm.control}
                              name="is_primary"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Primary Contact</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Set as the main contact for this supplier
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={contactForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Additional notes..." rows={2} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsAddContactOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit">Add Contact</Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {contactsLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-muted rounded-full"></div>
                            <div>
                              <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-24"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold">No contacts</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Get started by adding a contact person.
                      </p>
                      {canManageInventory && (
                        <Button className="mt-4" onClick={() => setIsAddContactOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Contact
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{contact.contact_name}</h4>
                              {contact.is_primary && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {contact.position} • {contact.department}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              {contact.phone && (
                                <span className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {contact.phone}
                                </span>
                              )}
                              {contact.email && (
                                <span className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {contact.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {canManageInventory && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Supplier Materials</CardTitle>
                    <CardDescription>Materials and equipment available from this supplier</CardDescription>
                  </div>
                  {canManageInventory && (
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Material
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {materialsLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-muted rounded-lg"></div>
                            <div>
                              <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-32"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : supplierMaterials.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold">No materials</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Get started by adding materials or equipment to this supplier.
                      </p>
                      {canManageInventory && (
                        <Button className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Material
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {supplierMaterials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{material.material_type}</h4>
                            <p className="text-sm text-muted-foreground">
                              €{material.unit_price_eur} per {material.unit} • Min order: {material.min_order_quantity} {material.unit}
                            </p>
                            {material.has_delivery && (
                              <p className="text-xs text-muted-foreground">
                                Delivery available (€{material.delivery_cost_eur})
                              </p>
                            )}
                          </div>
                        </div>
                        {canManageInventory && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Assigned Projects</CardTitle>
                    <CardDescription>Projects where this supplier is assigned</CardDescription>
                  </div>
                  {canManageInventory && (
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Assign to Project
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {projectsLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                          <div>
                            <div className="h-4 bg-muted rounded w-56 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-32"></div>
                          </div>
                          <div className="h-6 w-16 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : assignedProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold">No project assignments</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Assign this supplier to projects to track material orders.
                      </p>
                      {canManageInventory && (
                        <Button className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Assign to Project
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignedProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{project.project_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Assigned on {project.assigned_at ? new Date(project.assigned_at).toLocaleDateString() : 'Unknown'}
                          </p>
                          {project.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{project.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                          {canManageInventory && (
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Contacts</span>
                </div>
                <span className="text-sm font-medium">{contacts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Materials</span>
                </div>
                <span className="text-sm font-medium">{supplierMaterials.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Projects</span>
                </div>
                <span className="text-sm font-medium">{assignedProjects.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Material order placed</p>
                  <p className="text-muted-foreground">2 days ago</p>
                </div>
                <div>
                  <p className="font-medium">Contact updated</p>
                  <p className="text-muted-foreground">1 week ago</p>
                </div>
                <div>
                  <p className="font-medium">Assigned to new project</p>
                  <p className="text-muted-foreground">2 weeks ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}