// Base types
export type UUID = string;

// User types
export type UserRole = 'admin' | 'pm' | 'foreman' | 'crew' | 'viewer' | 'worker';
export type Language = 'ru' | 'en' | 'de' | 'uz' | 'tr';

export interface User {
  id: UUID;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  lang_pref: Language;
  role: UserRole;
  is_active: boolean;
  skills?: string[];
  pin_code?: string;
}

// Project types
export type ProjectStatus = 'draft' | 'active' | 'waiting_invoice' | 'closed';

export interface Project {
  id: UUID;
  name: string;
  customer?: string;
  city?: string;
  address?: string;
  contact_24h?: string;
  start_date?: string; // ISO date string
  end_date_plan?: string; // ISO date string
  status: ProjectStatus;
  total_length_m: number;
  base_rate_per_m: number;
  pm_user_id?: UUID;
  language_default: Language;
  pm_user?: User;
}

// Infrastructure types
export type SegmentSurface = 'asphalt' | 'concrete' | 'pavers' | 'green';
export type SegmentArea = 'roadway' | 'sidewalk' | 'driveway' | 'green';
export type SegmentStatus = 'open' | 'in_progress' | 'done';
export type CutStatus = 'open' | 'in_progress' | 'done';

export interface Cabinet {
  id: UUID;
  project_id: UUID;
  code?: string;
  name?: string;
  address?: string;
  geom_point?: {
    lat: number;
    lng: number;
  };
}

export interface Segment {
  id: UUID;
  cabinet_id: UUID;
  name?: string;
  length_planned_m: number;
  surface: SegmentSurface;
  area: SegmentArea;
  depth_req_m?: number;
  width_req_m?: number;
  geom_line?: {
    coordinates: [number, number][];
  };
  status: SegmentStatus;
}

export interface Cut {
  id: UUID;
  segment_id: UUID;
  code?: string;
  length_planned_m: number;
  length_done_m: number;
  status: CutStatus;
}

// Work entry types
export type StageCode =
  | 'stage_1_marking'
  | 'stage_2_excavation'
  | 'stage_3_conduit'
  | 'stage_4_cable'
  | 'stage_5_splice'
  | 'stage_6_test'
  | 'stage_7_connect'
  | 'stage_8_final'
  | 'stage_9_backfill'
  | 'stage_10_surface';

export type WorkMethod = 'mole' | 'hand' | 'excavator' | 'trencher' | 'documentation';
export type PhotoLabel = 'before' | 'during' | 'after' | 'instrument' | 'other';

export interface StageDef {
  id: UUID;
  code: StageCode;
  name_ru: string;
  name_de?: string;
  requires_photos_min: number;
  requires_measurements: boolean;
  requires_density: boolean;
}

export interface WorkEntry {
  id: UUID;
  project_id: UUID;
  cabinet_id?: UUID;
  segment_id?: UUID;
  cut_id?: UUID;
  house_id?: UUID;
  crew_id?: UUID;
  user_id: UUID;
  date: string; // ISO date string
  stage_code: StageCode;
  meters_done_m: number;
  method?: WorkMethod;
  width_m?: number;
  depth_m?: number;
  cables_count?: number;
  has_protection_pipe?: boolean;
  soil_type?: string;
  notes?: string;
  approved_by?: UUID;
  approved_at?: string; // ISO datetime string
  user?: User;
  approver?: User;
  photos?: Photo[];
}

export interface Photo {
  id: UUID;
  work_entry_id?: UUID;
  cut_stage_id?: UUID;
  url: string;
  ts: string; // ISO datetime string
  gps_lat?: number;
  gps_lon?: number;
  author_user_id?: UUID;
  label?: PhotoLabel;
  author?: User;
}

// Team types
export interface Crew {
  id: UUID;
  project_id?: UUID;
  name: string;
  foreman_user_id?: UUID;
  foreman?: User;
  members?: CrewMember[];
}

export interface CrewMember {
  id: UUID;
  crew_id: UUID;
  user_id: UUID;
  user?: User;
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApiError {
  message: string;
  details?: string;
  field?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Form types
export interface CreateProjectRequest {
  name: string;
  customer?: string;
  city?: string;
  address?: string;
  contact_24h?: string;
  start_date?: string;
  end_date_plan?: string;
  total_length_m: number;
  base_rate_per_m: number;
  pm_user_id?: UUID;
  language_default: Language;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus;
}

export interface CreateWorkEntryRequest {
  project_id: UUID;
  cabinet_id?: UUID;
  segment_id?: UUID;
  cut_id?: UUID;
  house_id?: UUID;
  crew_id?: UUID;
  stage_code: StageCode;
  meters_done_m: number;
  method?: WorkMethod;
  width_m?: number;
  depth_m?: number;
  cables_count?: number;
  has_protection_pipe?: boolean;
  soil_type?: string;
  notes?: string;
}

// Filter types
export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
  pm_user_id?: UUID;
  city?: string;
  page?: number;
  per_page?: number;
}

export interface WorkEntryFilters {
  project_id?: UUID;
  user_id?: UUID;
  stage_code?: StageCode;
  date_from?: string;
  date_to?: string;
  approved?: boolean;
  page?: number;
  per_page?: number;
}

// Authentication types
export interface LoginRequest {
  email?: string;
  phone?: string;
  pin_code: string;
  remember_me?: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  permissions: string[];
}

export interface AuthUser extends User {
  permissions: string[];
}

// Material types
export interface Material {
  id: UUID;
  name: string;
  category: string;
  unit: MaterialUnit;
  unit_cost: number;
  current_stock_qty: number;
  min_stock_level: number;
  max_stock_level: number;
  supplier_id?: UUID;
  description?: string;
  specifications?: Record<string, any>;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface Supplier {
  id: UUID;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialAllocation {
  id: UUID;
  material_id: UUID;
  project_id: UUID;
  team_id?: UUID;
  allocated_qty: number;
  used_qty: number;
  allocated_by: UUID;
  allocated_at: string;
  notes?: string;
  material?: Material;
  project?: Project;
  allocator?: User;
}

export interface MaterialOrder {
  id: UUID;
  supplier_id: UUID;
  order_number: string;
  status: MaterialOrderStatus;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  total_cost: number;
  notes?: string;
  created_by: UUID;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  creator?: User;
  items?: MaterialOrderItem[];
}

export interface MaterialOrderItem {
  id: UUID;
  order_id: UUID;
  material_id: UUID;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  material?: Material;
}

export type MaterialUnit =
  | "piece"
  | "meter"
  | "kg"
  | "ton"
  | "liter"
  | "m3"
  | "box"
  | "pallet"
  | "roll";

export type MaterialOrderStatus =
  | "draft"
  | "pending"
  | "ordered"
  | "delivered"
  | "cancelled";

export interface AllocationRequest {
  material_id: UUID;
  project_id: UUID;
  team_id?: UUID;
  requested_quantity: number;
  urgency: "low" | "normal" | "high" | "critical";
  required_by: string;
  justification: string;
}

export interface MaterialFilters {
  category?: string;
  supplier_id?: UUID;
  low_stock?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AllocationFilters {
  project_id?: UUID;
  team_id?: UUID;
  material_id?: UUID;
  allocated_by?: UUID;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface OrderFilters {
  supplier_id?: UUID;
  status?: MaterialOrderStatus;
  order_date_from?: string;
  order_date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// House Connection types
export interface House {
  id: UUID;
  project_id: UUID;
  house_number: string;
  address: string;
  customer_name?: string;
  customer_contact?: string;
  gps_lat?: number;
  gps_lon?: number;
  connection_type: ConnectionType;
  connection_method: ConnectionMethod;
  estimated_length_m: number;
  status: HouseConnectionStatus;
  scheduled_date?: string;
  assigned_team_id?: UUID;
  created_at: string;
  updated_at: string;
  project?: Project;
  assigned_team?: Crew;
  appointments?: HouseAppointment[];
  work_entries?: WorkEntry[];
}

export interface HouseAppointment {
  id: UUID;
  house_id: UUID;
  team_id: UUID;
  scheduled_date: string;
  estimated_duration: number;
  customer_contact: string;
  special_instructions?: string;
  status: AppointmentStatus;
  actual_start_time?: string;
  actual_end_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  house?: House;
  team?: Crew;
}

export type ConnectionType = "full" | "partial";
export type ConnectionMethod = "trench" | "mole";

export type HouseConnectionStatus =
  | "not_assigned"
  | "appointment_scheduled"
  | "in_progress"
  | "connected"
  | "partial_only"
  | "postponed";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled";

export interface CreateHouseRequest {
  project_id: UUID;
  house_number: string;
  address: string;
  customer_name?: string;
  customer_contact?: string;
  gps_lat?: number;
  gps_lon?: number;
  connection_type: ConnectionType;
  connection_method: ConnectionMethod;
  estimated_length_m: number;
}

export interface UpdateHouseRequest extends Partial<CreateHouseRequest> {
  status?: HouseConnectionStatus;
}

export interface ScheduleAppointmentRequest {
  house_id: UUID;
  team_id: UUID;
  scheduled_date: string;
  estimated_duration: number;
  customer_contact: string;
  special_instructions?: string;
}

export interface StartConnectionRequest {
  house_id: UUID;
  worker_id: UUID;
  before_photo: File;
  gps_location: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface CompleteConnectionRequest {
  house_id: UUID;
  connection_type: ConnectionType;
  after_photos: File[];
  measurements: {
    actual_length_m: number;
    depth_m?: number;
    cable_type?: string;
  };
  quality_checks: string[];
  customer_signature?: string;
  notes?: string;
}

export interface HouseFilters {
  project_id?: UUID;
  status?: HouseConnectionStatus;
  connection_type?: ConnectionType;
  assigned_team_id?: UUID;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AppointmentFilters {
  house_id?: UUID;
  team_id?: UUID;
  status?: AppointmentStatus;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
  page?: number;
  per_page?: number;
}

// Notification types
export interface Notification {
  id: UUID;
  user_id: UUID;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read_at?: string;
  created_at: string;
  expires_at?: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
}

export interface NotificationTemplate {
  id: UUID;
  type: NotificationType;
  subject: Record<string, string>; // Multi-language subjects
  body: Record<string, string>; // Multi-language bodies
  channels: NotificationChannel[];
  priority: NotificationPriority;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: UUID;
  user_id: UUID;
  enabled_channels: NotificationChannel[];
  notification_types: Record<NotificationType, NotificationChannelPreference>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationChannelPreference {
  enabled: boolean;
  channels: NotificationChannel[];
  frequency?: "immediate" | "hourly" | "daily" | "weekly";
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: string;
}

export interface RealtimeEvent {
  type: RealtimeEventType;
  entity_type: string;
  entity_id: UUID;
  data: any;
  user_id?: UUID;
  project_id?: UUID;
  timestamp: string;
}

export type NotificationChannel = "websocket" | "push" | "email" | "sms" | "in_app";

export type NotificationType =
  | "work_entry_created"
  | "work_entry_approved"
  | "work_entry_rejected"
  | "project_status_changed"
  | "project_assigned"
  | "team_assignment_changed"
  | "material_low_stock"
  | "material_order_delivered"
  | "house_appointment_scheduled"
  | "house_connection_completed"
  | "budget_alert"
  | "deadline_reminder"
  | "system_maintenance"
  | "user_mention"
  | "approval_required";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type WebSocketMessageType =
  | "notification"
  | "realtime_update"
  | "typing_indicator"
  | "user_status"
  | "heartbeat";

export type RealtimeEventType =
  | "entity_created"
  | "entity_updated"
  | "entity_deleted"
  | "status_changed"
  | "assignment_changed"
  | "progress_updated";

export interface CreateNotificationRequest {
  user_id: UUID;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  priority?: NotificationPriority;
  expires_at?: string;
}

export interface UpdateNotificationPreferencesRequest {
  enabled_channels: NotificationChannel[];
  notification_types: Record<NotificationType, NotificationChannelPreference>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
  language?: string;
}

export interface NotificationFilters {
  user_id?: UUID;
  type?: NotificationType;
  read?: boolean;
  priority?: NotificationPriority;
  created_after?: string;
  created_before?: string;
  page?: number;
  per_page?: number;
}

// Document Management types
export interface Document {
  id: UUID;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  checksum: string;
  url: string;
  path: string;
  uploaded_by: UUID;
  uploaded_at: string;
  category: DocumentCategory;
  tags: string[];
  extracted_text?: string;
  ocr_data?: OCRResult;
  project_id?: UUID;
  house_id?: UUID;
  work_entry_id?: UUID;
  team_id?: UUID;
  version: number;
  is_encrypted: boolean;
  access_level: DocumentAccessLevel;
  retention_until?: string;
  created_at: string;
  updated_at: string;
  uploader?: User;
  project?: Project;
  house?: House;
  work_entry?: WorkEntry;
  team?: Crew;
}

export interface DocumentCategory {
  code: string;
  name: Record<string, string>; // Multi-language names
  description?: Record<string, string>;
  required_fields: string[];
  retention_period: number; // days
  encryption_required: boolean;
  access_level: DocumentAccessLevel;
  allowed_mime_types: string[];
  max_file_size: number; // bytes
  requires_ocr: boolean;
  auto_classify: boolean;
  icon?: string;
  color?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  pages?: OCRPage[];
  metadata?: Record<string, any>;
  processing_time: number;
  engine: string;
}

export interface OCRPage {
  page_number: number;
  text: string;
  confidence: number;
  words?: OCRWord[];
  lines?: OCRLine[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRLine {
  text: string;
  confidence: number;
  words: OCRWord[];
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DocumentVersion {
  id: UUID;
  document_id: UUID;
  version: number;
  filename: string;
  size: number;
  checksum: string;
  url: string;
  uploaded_by: UUID;
  uploaded_at: string;
  comment?: string;
  is_current: boolean;
  uploader?: User;
}

export interface DocumentAccess {
  id: UUID;
  document_id: UUID;
  user_id?: UUID;
  team_id?: UUID;
  role?: UserRole;
  permissions: DocumentPermission[];
  granted_by: UUID;
  granted_at: string;
  expires_at?: string;
}

export interface DocumentShare {
  id: UUID;
  document_id: UUID;
  shared_by: UUID;
  shared_with?: UUID; // null for public links
  share_token: string;
  permissions: DocumentPermission[];
  expires_at?: string;
  password_protected: boolean;
  access_count: number;
  last_accessed_at?: string;
  created_at: string;
  is_active: boolean;
}

export interface DocumentTemplate {
  id: UUID;
  name: string;
  description?: string;
  category: DocumentCategory;
  template_file_url: string;
  required_fields: DocumentField[];
  is_active: boolean;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface DocumentField {
  name: string;
  type: DocumentFieldType;
  label: Record<string, string>;
  required: boolean;
  default_value?: any;
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    options?: string[];
  };
}

export type DocumentAccessLevel = "public" | "project" | "team" | "private" | "admin";
export type DocumentPermission = "read" | "write" | "delete" | "share" | "admin";
export type DocumentFieldType = "text" | "number" | "date" | "select" | "multiselect" | "boolean" | "file";

export type DocumentCategoryCode =
  | "WORK_PERMIT"
  | "RESIDENCE_PERMIT"
  | "PASSPORT"
  | "DRIVER_LICENSE"
  | "PROJECT_PLAN"
  | "HOUSE_PLAN"
  | "PHOTO_BEFORE"
  | "PHOTO_DURING"
  | "PHOTO_AFTER"
  | "SAFETY_DOCUMENT"
  | "CONTRACT"
  | "INVOICE"
  | "REPORT"
  | "CERTIFICATE"
  | "OTHER";

export interface CreateDocumentRequest {
  file: File;
  category?: DocumentCategoryCode;
  tags?: string[];
  project_id?: UUID;
  house_id?: UUID;
  work_entry_id?: UUID;
  team_id?: UUID;
  access_level?: DocumentAccessLevel;
  description?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdateDocumentRequest {
  filename?: string;
  category?: DocumentCategoryCode;
  tags?: string[];
  access_level?: DocumentAccessLevel;
  description?: string;
  custom_fields?: Record<string, any>;
}

export interface DocumentFilters {
  category?: DocumentCategoryCode;
  project_id?: UUID;
  house_id?: UUID;
  work_entry_id?: UUID;
  team_id?: UUID;
  uploaded_by?: UUID;
  access_level?: DocumentAccessLevel;
  mime_type?: string;
  has_ocr?: boolean;
  tags?: string[];
  uploaded_after?: string;
  uploaded_before?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface DocumentSearchRequest {
  query: string;
  filters?: DocumentFilters;
  include_content?: boolean;
  highlight?: boolean;
  fuzzy?: boolean;
}

export interface DocumentSearchResult {
  document: Document;
  score: number;
  highlights?: {
    filename?: string[];
    content?: string[];
    tags?: string[];
  };
}

export interface DocumentClassificationRequest {
  filename: string;
  mime_type: string;
  extracted_text?: string;
  file_size: number;
}

export interface DocumentClassificationResult {
  category: DocumentCategoryCode;
  confidence: number;
  suggested_tags: string[];
  extracted_fields?: Record<string, any>;
}

// Geospatial Data types
export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: string;
}

export interface GeoLineString {
  coordinates: [number, number][]; // [longitude, latitude] pairs
  length?: number; // calculated length in meters
}

export interface GeoPolygon {
  coordinates: [number, number][][]; // First array is exterior ring
  area?: number; // calculated area in square meters
}

export interface GeospatialFeature {
  id: UUID;
  type: GeometryType;
  geometry: GeoPoint | GeoLineString | GeoPolygon;
  properties: Record<string, any>;
  project_id: UUID;
  entity_type: GeospatialEntityType;
  entity_id: UUID;
  created_at: string;
  updated_at: string;
  created_by: UUID;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  center?: GeoPoint;
}

export interface GeoRoute {
  id: UUID;
  name: string;
  description?: string;
  waypoints: GeoPoint[];
  distance_meters: number;
  estimated_duration_minutes: number;
  route_type: RouteType;
  project_id?: UUID;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface GeoLayer {
  id: UUID;
  name: string;
  description?: string;
  layer_type: LayerType;
  style: LayerStyle;
  features: GeospatialFeature[];
  is_visible: boolean;
  opacity: number;
  z_index: number;
  project_id?: UUID;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface LayerStyle {
  stroke_color?: string;
  stroke_width?: number;
  stroke_opacity?: number;
  fill_color?: string;
  fill_opacity?: number;
  marker_color?: string;
  marker_size?: number;
  marker_symbol?: string;
  label_field?: string;
  label_color?: string;
  label_size?: number;
}

export interface GeoMeasurement {
  id: UUID;
  measurement_type: MeasurementType;
  geometry: GeoLineString | GeoPolygon;
  value: number;
  unit: MeasurementUnit;
  label?: string;
  notes?: string;
  project_id?: UUID;
  measured_by: UUID;
  measured_at: string;
}

export interface GeoAnnotation {
  id: UUID;
  position: GeoPoint;
  title: string;
  description?: string;
  annotation_type: AnnotationType;
  icon?: string;
  color?: string;
  project_id?: UUID;
  entity_type?: GeospatialEntityType;
  entity_id?: UUID;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface MapTile {
  id: UUID;
  name: string;
  description?: string;
  tile_url: string;
  attribution: string;
  max_zoom: number;
  min_zoom: number;
  is_base_layer: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeoAnalysis {
  id: UUID;
  analysis_type: AnalysisType;
  name: string;
  description?: string;
  input_features: UUID[];
  result_geometry?: GeoLineString | GeoPolygon;
  result_data: Record<string, any>;
  parameters: Record<string, any>;
  project_id?: UUID;
  created_by: UUID;
  created_at: string;
  status: AnalysisStatus;
}

export type GeometryType = "Point" | "LineString" | "Polygon";
export type GeospatialEntityType = "cabinet" | "segment" | "house" | "work_location" | "route" | "boundary" | "utility" | "obstacle";
export type RouteType = "driving" | "walking" | "cycling" | "truck" | "custom";
export type LayerType = "vector" | "raster" | "heatmap" | "cluster" | "wms" | "wmts";
export type MeasurementType = "distance" | "area" | "perimeter" | "elevation" | "angle";
export type MeasurementUnit = "meters" | "kilometers" | "feet" | "miles" | "square_meters" | "square_kilometers" | "square_feet" | "acres" | "degrees";
export type AnnotationType = "info" | "warning" | "error" | "note" | "photo" | "measurement";
export type AnalysisType = "buffer" | "intersection" | "union" | "difference" | "nearest" | "route_optimization" | "visibility" | "elevation_profile";
export type AnalysisStatus = "pending" | "running" | "completed" | "failed";

export interface CreateGeospatialFeatureRequest {
  type: GeometryType;
  geometry: GeoPoint | GeoLineString | GeoPolygon;
  properties?: Record<string, any>;
  project_id: UUID;
  entity_type: GeospatialEntityType;
  entity_id: UUID;
}

export interface UpdateGeospatialFeatureRequest {
  geometry?: GeoPoint | GeoLineString | GeoPolygon;
  properties?: Record<string, any>;
}

export interface GeospatialSearchRequest {
  center: GeoPoint;
  radius_meters: number;
  feature_types?: GeospatialEntityType[];
  project_id?: UUID;
}

export interface CreateGeoRouteRequest {
  name: string;
  description?: string;
  waypoints: GeoPoint[];
  route_type: RouteType;
  project_id?: UUID;
}

export interface CreateGeoLayerRequest {
  name: string;
  description?: string;
  layer_type: LayerType;
  style: LayerStyle;
  is_visible?: boolean;
  opacity?: number;
  z_index?: number;
  project_id?: UUID;
}

export interface CreateGeoMeasurementRequest {
  measurement_type: MeasurementType;
  geometry: GeoLineString | GeoPolygon;
  unit: MeasurementUnit;
  label?: string;
  notes?: string;
  project_id?: UUID;
}

export interface CreateGeoAnnotationRequest {
  position: GeoPoint;
  title: string;
  description?: string;
  annotation_type: AnnotationType;
  icon?: string;
  color?: string;
  project_id?: UUID;
  entity_type?: GeospatialEntityType;
  entity_id?: UUID;
}

export interface CreateGeoAnalysisRequest {
  analysis_type: AnalysisType;
  name: string;
  description?: string;
  input_features: UUID[];
  parameters: Record<string, any>;
  project_id?: UUID;
}

export interface GeospatialFilters {
  project_id?: UUID;
  entity_type?: GeospatialEntityType;
  entity_id?: UUID;
  geometry_type?: GeometryType;
  within_bounds?: GeoBounds;
  created_after?: string;
  created_before?: string;
  page?: number;
  per_page?: number;
}