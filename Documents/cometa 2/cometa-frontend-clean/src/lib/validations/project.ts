import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  customer: z.string().min(1, "Customer is required"),
  city: z.string().min(1, "City is required"),
  total_length_m: z.number().min(0, "Length must be positive"),
  base_rate_per_m: z.number().min(0, "Rate must be positive"),
  pm_user_id: z.string().uuid().optional(),
});

export const workEntrySchema = z.object({
  project_id: z.string().uuid("Invalid project ID"),
  stage_code: z.string().min(1, "Stage code is required"),
  meters_done_m: z.number().min(0, "Meters must be positive"),
  notes: z.string().optional(),
  gps_location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

export const materialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  unit: z.string().min(1, "Unit is required"),
  current_stock_qty: z.number().min(0, "Stock quantity must be positive"),
  min_stock_level: z.number().min(0, "Minimum stock level must be positive"),
  unit_price_eur: z.number().min(0, "Price must be positive"),
  supplier_id: z.string().uuid().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
export type WorkEntryFormData = z.infer<typeof workEntrySchema>;
export type MaterialFormData = z.infer<typeof materialSchema>;