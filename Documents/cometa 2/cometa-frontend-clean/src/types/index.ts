// Core types based on existing COMETA models
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "pm" | "foreman" | "crew" | "viewer" | "worker";
  language: "de" | "ru" | "en" | "uz" | "tr";
  phone?: string;
  pin_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  customer: string;
  city: string;
  status: "draft" | "active" | "waiting_invoice" | "closed";
  total_length_m: number;
  base_rate_per_m: number;
  pm_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkEntry {
  id: string;
  project_id: string;
  user_id: string;
  stage_code: string;
  meters_done_m: number;
  date: string;
  photos: Photo[];
  gps_location?: {
    latitude: number;
    longitude: number;
  };
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  filename: string;
  url: string;
  caption?: string;
  gps_location?: {
    latitude: number;
    longitude: number;
  };
  uploaded_at: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  current_stock_qty: number;
  min_stock_level: number;
  unit_price_eur: number;
  supplier_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  leader_id: string;
  members: User[];
  project_id?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  pin_code: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

// Form types
export interface ProjectFormData {
  name: string;
  customer: string;
  city: string;
  total_length_m: number;
  base_rate_per_m: number;
  pm_user_id?: string;
}

export interface WorkEntryFormData {
  project_id: string;
  stage_code: string;
  meters_done_m: number;
  notes?: string;
  photos: File[];
}

// Dashboard types
export interface DashboardStats {
  projects: {
    active: number;
    total: number;
  };
  work: {
    week_entries: number;
    week_meters: number;
  };
  recent_activity: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  description: string;
  project_id?: string;
  created_at: string;
}

// Query params
export interface ProjectsQueryParams {
  status?: Project["status"];
  pm_user_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface WorkEntriesQueryParams {
  project_id?: string;
  user_id?: string;
  stage_code?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}