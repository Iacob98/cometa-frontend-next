// Project Preparation Phase Management Types
export interface ProjectPreparationPhase {
  phase: number;
  name: string;
  description: string;
  requiredDocuments: string[];
  dependencies: number[];
  estimatedDuration: number; // hours
  autoAdvance: boolean;
  isComplete: boolean;
  completedAt?: Date;
  nextPhases: number[];
}

export interface ProjectPhaseProgress {
  currentPhase: number;
  completedPhases: number[];
  blockedPhases: number[];
  totalEstimatedHours: number;
  actualHoursSpent: number;
  estimatedCompletion: Date;
  overallProgress: number; // percentage 0-100
}

export interface PhaseDocument {
  id: string;
  phaseNumber: number;
  projectId: string;
  documentType: string;
  filename: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface PhaseAdvancementRequest {
  projectId: string;
  fromPhase: number;
  toPhase: number;
  documents: File[];
  notes?: string;
  userId: string;
}

export interface UtilityContact {
  id: string;
  projectId: string;
  organizationName: string;
  contactType: 'electricity' | 'gas' | 'water' | 'sewage' | 'telecom' | 'other';
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectZoneLayout {
  id: string;
  projectId: string;
  zoneName: string;
  coordinates: {
    lat: number;
    lng: number;
  }[];
  nvtPoints: NVTPoint[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NVTPoint {
  id: string;
  zoneId: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'distribution' | 'splice' | 'terminal';
  capacity: number;
  usedCapacity: number;
  status: 'planned' | 'installed' | 'active' | 'inactive';
  notes?: string;
}

export interface FacilitySetup {
  id: string;
  projectId: string;
  facilityType: 'office' | 'storage' | 'parking' | 'workshop' | 'other';
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  capacity: number;
  currentOccupancy: number;
  amenities: string[];
  permits: Permit[];
  monthlyRent?: number;
  currency?: string;
  startDate: Date;
  endDate?: Date;
  status: 'planned' | 'reserved' | 'active' | 'terminated';
}

export interface Permit {
  id: string;
  type: string;
  number: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  documentUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface HousingArrangement {
  id: string;
  projectId: string;
  workerId: string;
  accommodationType: 'hotel' | 'apartment' | 'shared' | 'other';
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  checkInDate: Date;
  checkOutDate?: Date;
  costPerNight: number;
  currency: string;
  amenities: string[];
  notes?: string;
  status: 'booked' | 'checked_in' | 'checked_out' | 'cancelled';
}

export interface TeamAssignment {
  id: string;
  projectId: string;
  teamId: string;
  phaseNumber: number;
  role: 'primary' | 'support' | 'specialist';
  startDate: Date;
  endDate?: Date;
  responsibilities: string[];
  requiredSkills: string[];
  assignedBy: string;
  assignedAt: Date;
  status: 'planned' | 'active' | 'completed' | 'reassigned';
}

export interface AccessPermit {
  id: string;
  projectId: string;
  permitType: 'site_access' | 'excavation' | 'traffic' | 'utility' | 'other';
  authority: string;
  permitNumber: string;
  validFrom: Date;
  validTo: Date;
  restrictions: string[];
  documentUrl?: string;
  status: 'applied' | 'approved' | 'active' | 'expired' | 'revoked';
}

export interface ResourcePlan {
  id: string;
  projectId: string;
  phaseNumber: number;
  materialRequirements: MaterialRequirement[];
  equipmentRequirements: EquipmentRequirement[];
  vehicleRequirements: VehicleRequirement[];
  estimatedCost: number;
  currency: string;
  planCreatedBy: string;
  planCreatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
}

export interface MaterialRequirement {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  estimatedUnitCost: number;
  supplier?: string;
  deliveryDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

export interface EquipmentRequirement {
  equipmentType: string;
  quantity: number;
  duration: number; // days
  estimatedDailyCost: number;
  specifications: Record<string, any>;
  preferredSupplier?: string;
  deliveryDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface VehicleRequirement {
  vehicleType: 'van' | 'truck' | 'excavator' | 'crane' | 'other';
  quantity: number;
  duration: number; // days
  estimatedDailyCost: number;
  specifications: Record<string, any>;
  licenseRequired?: string;
  deliveryDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface HousePreparation {
  id: string;
  projectId: string;
  houseId: string;
  connectionType: 'full' | 'partial';
  method: 'trench' | 'mole' | 'aerial';
  estimatedLength: number;
  plannedDate?: Date;
  permits: Permit[];
  specialRequirements: string[];
  customerContact: CustomerContact;
  status: 'not_prepared' | 'planning' | 'permits_pending' | 'ready';
  notes?: string;
}

export interface CustomerContact {
  name: string;
  phone: string;
  email?: string;
  preferredContactTime?: string;
  language: string;
  specialInstructions?: string;
}

export interface ReadinessChecklist {
  id: string;
  projectId: string;
  checklistItems: ChecklistItem[];
  completionPercentage: number;
  verifiedBy?: string;
  verifiedAt?: Date;
  overallStatus: 'not_ready' | 'partially_ready' | 'ready' | 'verified';
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  category: 'documentation' | 'resources' | 'permits' | 'team' | 'safety' | 'other';
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  evidence?: string; // URL to document or photo
  notes?: string;
}

export interface MonitoringConfig {
  id: string;
  projectId: string;
  metricsToTrack: string[];
  reportingFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  recipients: string[]; // user IDs
  alertThresholds: Record<string, number>;
  dashboardConfig: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

// Constants for project preparation phases
export const PROJECT_PREPARATION_PHASES: ProjectPreparationPhase[] = [
  {
    phase: 0,
    name: "Project Creation",
    description: "Initial project setup and basic information",
    requiredDocuments: ["contract", "initial_survey"],
    dependencies: [],
    estimatedDuration: 2,
    autoAdvance: false,
    isComplete: false,
    nextPhases: [1],
  },
  {
    phase: 1,
    name: "Plans & Communications",
    description: "Upload plans, setup communication channels",
    requiredDocuments: ["traffic_plan", "utility_plan", "communication_plan"],
    dependencies: [0],
    estimatedDuration: 4,
    autoAdvance: false,
    isComplete: false,
    nextPhases: [2],
  },
  {
    phase: 2,
    name: "Zone Layout",
    description: "Define work zones and NVT points",
    requiredDocuments: ["zone_map", "nvt_layout"],
    dependencies: [1],
    estimatedDuration: 6,
    autoAdvance: false,
    isComplete: false,
    nextPhases: [3],
  },
  {
    phase: 3,
    name: "Facilities & Housing",
    description: "Setup site facilities and worker housing",
    requiredDocuments: ["facility_permits", "housing_contracts"],
    dependencies: [2],
    estimatedDuration: 8,
    autoAdvance: false,
    isComplete: false,
    nextPhases: [4],
  },
  {
    phase: 4,
    name: "Team & Access",
    description: "Assign teams and setup site access",
    requiredDocuments: ["team_assignments", "access_permits"],
    dependencies: [3],
    estimatedDuration: 4,
    autoAdvance: true,
    isComplete: false,
    nextPhases: [5],
  },
  {
    phase: 5,
    name: "Resources Planning",
    description: "Plan resource requirements and procurement",
    requiredDocuments: ["resource_plan", "procurement_schedule"],
    dependencies: [4],
    estimatedDuration: 6,
    autoAdvance: false,
    isComplete: false,
    nextPhases: [6],
  },
  {
    phase: 6,
    name: "Materials Procurement",
    description: "Order and allocate materials",
    requiredDocuments: ["material_orders", "delivery_schedule"],
    dependencies: [5],
    estimatedDuration: 12,
    autoAdvance: false,
    isComplete: false,
    nextPhases: [7],
  },
  {
    phase: 7,
    name: "Houses Preparation",
    description: "Prepare house connection plans",
    requiredDocuments: ["house_permits", "connection_plans"],
    dependencies: [6],
    estimatedDuration: 8,
    autoAdvance: false,
    isComplete: false,
    nextPhases: [8],
  },
  {
    phase: 8,
    name: "Readiness Check",
    description: "Final readiness verification",
    requiredDocuments: ["readiness_checklist", "safety_clearance"],
    dependencies: [7],
    estimatedDuration: 2,
    autoAdvance: false,
    isComplete: false,
    nextPhases: [9],
  },
  {
    phase: 9,
    name: "Project Activation",
    description: "Activate project for work execution",
    requiredDocuments: ["activation_approval"],
    dependencies: [8],
    estimatedDuration: 1,
    autoAdvance: true,
    isComplete: false,
    nextPhases: [10],
  },
  {
    phase: 10,
    name: "Monitoring Setup",
    description: "Setup monitoring and reporting",
    requiredDocuments: ["monitoring_config"],
    dependencies: [9],
    estimatedDuration: 2,
    autoAdvance: true,
    isComplete: false,
    nextPhases: [],
  },
];

// Phase validation schemas
export interface PhaseValidationResult {
  isValid: boolean;
  missingRequirements: string[];
  warnings: string[];
  canAdvance: boolean;
}

// Service interface for project preparation
export interface ProjectPreparationService {
  getCurrentPhase(projectId: string): Promise<number>;
  advanceToNextPhase(projectId: string, phaseData: any): Promise<void>;
  validatePhaseRequirements(projectId: string, phase: number): Promise<PhaseValidationResult>;
  getPhaseProgress(projectId: string): Promise<ProjectPhaseProgress>;
  uploadPhaseDocument(projectId: string, phase: number, file: File): Promise<PhaseDocument>;
  getPhaseDocuments(projectId: string, phase: number): Promise<PhaseDocument[]>;
}