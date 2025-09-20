import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  pin_code: z.string().min(4, "PIN must be at least 4 digits").max(6, "PIN must be at most 6 digits"),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "pm", "foreman", "crew", "viewer", "worker"]),
  language: z.enum(["de", "ru", "en", "uz", "tr"]).default("de"),
  phone: z.string().optional(),
  pin_code: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type UserData = z.infer<typeof userSchema>;