// Work Stage Management System Types
export interface WorkStage {
  code: string;
  name: Record<string, string>; // Multi-language support
  description: Record<string, string>;
  requirements: StageRequirements;
  nextStages: string[];
  estimatedDuration: number; // minutes
  requiredTools: string[];
  safetyRequirements: string[];
  qualityStandards: string[];
  isActive: boolean;
}

export interface StageRequirements {
  minPhotos: number;
  maxPhotos: number;
  requiredMeasurements: string[];
  requiredGPS: boolean;
  qualityChecks: string[];
  materialUsage: MaterialRequirement[];
  weatherRestrictions?: WeatherRestriction[];
  timeOfDayRestrictions?: TimeRestriction[];
}

export interface MaterialRequirement {
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  alternatives?: string[]; // alternative material codes
}

export interface WeatherRestriction {
  condition: 'rain' | 'snow' | 'wind' | 'temperature';
  operator: 'above' | 'below' | 'equals';
  value: number;
  unit: string;
  reason: string;
}

export interface TimeRestriction {
  startTime: string; // HH:mm format
  endTime: string;
  reason: string;
  dayOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
}

export interface WorkEntry {
  id: string;
  projectId: string;
  segmentId?: string;
  houseId?: string;
  stageCode: string;
  stageName: string;
  userId: string;
  teamId?: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  metersStart?: number;
  metersEnd?: number;
  metersDone: number;
  photos: WorkPhoto[];
  measurements: Record<string, number>;
  gpsLocation?: GPSCoordinate;
  weatherConditions?: WeatherData;
  qualityChecks: QualityCheck[];
  materialUsed: MaterialUsage[];
  toolsUsed: string[];
  notes?: string;
  status: WorkEntryStatus;
  approvedBy?: string;
  approvedAt?: Date;
  approvalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkPhoto {
  id: string;
  url: string;
  caption?: string;
  type: 'before' | 'during' | 'after' | 'quality' | 'safety' | 'other';
  timestamp: Date;
  gpsLocation?: GPSCoordinate;
  metadata?: PhotoMetadata;
}

export interface PhotoMetadata {
  camera?: string;
  resolution?: string;
  fileSize?: number;
  orientation?: number;
  flash?: boolean;
  focalLength?: number;
}

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: Date;
  address?: string; // resolved address
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  conditions: string; // clear, cloudy, rain, snow, etc.
  visibility: number;
  pressure: number;
  timestamp: Date;
}

export interface QualityCheck {
  checkType: string;
  expected: string | number;
  actual: string | number;
  passed: boolean;
  tolerance?: number;
  notes?: string;
  inspector?: string;
  timestamp: Date;
}

export interface MaterialUsage {
  materialId: string;
  materialName: string;
  quantityUsed: number;
  unit: string;
  lotNumber?: string;
  expiryDate?: Date;
  notes?: string;
}

export type WorkEntryStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'requires_revision';

export interface CreateWorkEntryRequest {
  projectId: string;
  segmentId?: string;
  houseId?: string;
  stageCode: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  metersStart?: number;
  metersEnd?: number;
  photos: File[];
  measurements: Record<string, number>;
  gpsLocation?: GPSCoordinate;
  weatherConditions?: WeatherData;
  materialUsed: MaterialUsage[];
  toolsUsed: string[];
  notes?: string;
}

export interface WorkEntryApproval {
  workEntryId: string;
  action: 'approve' | 'reject' | 'request_revision';
  notes?: string;
  qualityScore?: number; // 1-10
  suggestedImprovements?: string[];
  followUpRequired?: boolean;
}

export interface StageValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  canSubmit: boolean;
  estimatedDuration?: number;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  canOverride: boolean;
}

// Pre-defined work stages for fiber optic installation
export const WORK_STAGES: WorkStage[] = [
  {
    code: "stage_1_marking",
    name: {
      ru: "Разметка",
      de: "Markierung",
      en: "Marking",
      uz: "Belgilash",
      tr: "İşaretleme",
    },
    description: {
      ru: "Разметка трассы прокладки кабеля",
      de: "Markierung der Kabeltrasse",
      en: "Cable route marking",
      uz: "Kabel yo'nalishini belgilash",
      tr: "Kablo güzergahı işaretleme",
    },
    requirements: {
      minPhotos: 2,
      maxPhotos: 5,
      requiredMeasurements: ["length", "width"],
      requiredGPS: true,
      qualityChecks: ["route_clearance", "utility_conflicts"],
      materialUsage: [
        {
          materialCode: "marking_spray",
          materialName: "Marking Spray",
          quantity: 1,
          unit: "bottle",
          isOptional: false
        },
        {
          materialCode: "marking_flags",
          materialName: "Marking Flags",
          quantity: 10,
          unit: "pieces",
          isOptional: false
        },
      ],
      weatherRestrictions: [
        {
          condition: 'rain',
          operator: 'above',
          value: 5,
          unit: 'mm/h',
          reason: 'Paint marking not effective in heavy rain'
        }
      ]
    },
    nextStages: ["stage_2_excavation"],
    estimatedDuration: 60,
    requiredTools: ["measuring_tape", "marking_spray", "gps_device"],
    safetyRequirements: ["safety_vest", "hard_hat"],
    qualityStandards: ["accurate_measurements", "clear_markings", "documentation_complete"],
    isActive: true,
  },
  {
    code: "stage_2_excavation",
    name: {
      ru: "Выемка грунта",
      de: "Aushub",
      en: "Excavation",
      uz: "Qazish",
      tr: "Kazı",
    },
    description: {
      ru: "Выемка грунта для прокладки кабеля",
      de: "Bodenaushub für Kabelverlegung",
      en: "Ground excavation for cable laying",
      uz: "Kabel yotqizish uchun tuproq qazish",
      tr: "Kablo döşeme için toprak kazısı",
    },
    requirements: {
      minPhotos: 3,
      maxPhotos: 8,
      requiredMeasurements: ["depth", "width", "length"],
      requiredGPS: true,
      qualityChecks: [
        "depth_compliance",
        "width_compliance",
        "utility_clearance",
        "soil_condition"
      ],
      materialUsage: [
        {
          materialCode: "warning_tape",
          materialName: "Warning Tape",
          quantity: 100,
          unit: "meters",
          isOptional: false
        },
      ],
      weatherRestrictions: [
        {
          condition: 'rain',
          operator: 'above',
          value: 10,
          unit: 'mm/h',
          reason: 'Unsafe excavation conditions'
        },
        {
          condition: 'temperature',
          operator: 'below',
          value: -10,
          unit: 'celsius',
          reason: 'Frozen ground conditions'
        }
      ]
    },
    nextStages: ["stage_3_conduit"],
    estimatedDuration: 120,
    requiredTools: ["excavator", "shovel", "measuring_tape", "safety_equipment"],
    safetyRequirements: ["safety_vest", "hard_hat", "steel_toe_boots", "safety_barriers"],
    qualityStandards: ["proper_depth", "clean_excavation", "utility_protection"],
    isActive: true,
  },
  {
    code: "stage_3_conduit",
    name: {
      ru: "Укладка труб",
      de: "Rohrverlegung",
      en: "Conduit Installation",
      uz: "Quvur o'rnatish",
      tr: "Boru döşeme",
    },
    description: {
      ru: "Укладка защитных труб для кабеля",
      de: "Verlegung von Schutzrohren für Kabel",
      en: "Installation of protective conduits for cables",
      uz: "Kabellar uchun himoya quvurlarini o'rnatish",
      tr: "Kablolar için koruyucu boru döşeme",
    },
    requirements: {
      minPhotos: 4,
      maxPhotos: 10,
      requiredMeasurements: ["length", "diameter", "depth"],
      requiredGPS: true,
      qualityChecks: [
        "conduit_alignment",
        "joint_integrity",
        "gradient_check",
        "pull_string_installed"
      ],
      materialUsage: [
        {
          materialCode: "hdpe_conduit",
          materialName: "HDPE Conduit",
          quantity: 100,
          unit: "meters",
          isOptional: false
        },
        {
          materialCode: "conduit_joints",
          materialName: "Conduit Joints",
          quantity: 10,
          unit: "pieces",
          isOptional: false
        },
        {
          materialCode: "pull_string",
          materialName: "Pull String",
          quantity: 110,
          unit: "meters",
          isOptional: false
        },
      ],
    },
    nextStages: ["stage_4_backfill"],
    estimatedDuration: 90,
    requiredTools: ["pipe_cutter", "conduit_bender", "pull_string_threader"],
    safetyRequirements: ["safety_vest", "hard_hat", "gloves"],
    qualityStandards: ["proper_slope", "secure_joints", "pull_string_continuous"],
    isActive: true,
  },
  {
    code: "stage_4_backfill",
    name: {
      ru: "Засыпка",
      de: "Verfüllung",
      en: "Backfill",
      uz: "To'ldirish",
      tr: "Geri dolgu",
    },
    description: {
      ru: "Засыпка траншеи и восстановление покрытия",
      de: "Verfüllung des Grabens und Wiederherstellung der Oberfläche",
      en: "Trench backfilling and surface restoration",
      uz: "Xandaqni to'ldirish va sirtni tiklash",
      tr: "Hendek doldurma ve yüzey restorasyonu",
    },
    requirements: {
      minPhotos: 3,
      maxPhotos: 6,
      requiredMeasurements: ["compaction_density"],
      requiredGPS: true,
      qualityChecks: [
        "proper_compaction",
        "surface_level",
        "warning_tape_placement"
      ],
      materialUsage: [
        {
          materialCode: "backfill_sand",
          materialName: "Backfill Sand",
          quantity: 5,
          unit: "cubic_meters",
          isOptional: false
        },
        {
          materialCode: "warning_tape",
          materialName: "Warning Tape",
          quantity: 100,
          unit: "meters",
          isOptional: false
        },
      ],
    },
    nextStages: ["stage_5_cable_pulling"],
    estimatedDuration: 60,
    requiredTools: ["compactor", "shovel", "level"],
    safetyRequirements: ["safety_vest", "hard_hat"],
    qualityStandards: ["adequate_compaction", "level_surface", "proper_warning_placement"],
    isActive: true,
  },
  {
    code: "stage_5_cable_pulling",
    name: {
      ru: "Протяжка кабеля",
      de: "Kabeleinzug",
      en: "Cable Pulling",
      uz: "Kabel tortish",
      tr: "Kablo çekme",
    },
    description: {
      ru: "Протяжка оптического кабеля через трубы",
      de: "Einziehen des Glasfaserkabels durch die Rohre",
      en: "Pulling fiber optic cable through conduits",
      uz: "Optik kabelni quvurlar orqali tortish",
      tr: "Fiber optik kabloyu borular arasından çekme",
    },
    requirements: {
      minPhotos: 5,
      maxPhotos: 12,
      requiredMeasurements: ["cable_length", "pulling_tension"],
      requiredGPS: true,
      qualityChecks: [
        "cable_integrity",
        "pulling_tension_limits",
        "bend_radius_compliance",
        "cable_marking"
      ],
      materialUsage: [
        {
          materialCode: "fiber_cable",
          materialName: "Fiber Optic Cable",
          quantity: 100,
          unit: "meters",
          isOptional: false
        },
        {
          materialCode: "cable_lubricant",
          materialName: "Cable Pulling Lubricant",
          quantity: 1,
          unit: "liter",
          isOptional: true
        },
      ],
    },
    nextStages: ["stage_6_splicing"],
    estimatedDuration: 120,
    requiredTools: ["cable_puller", "tension_meter", "cable_cutter"],
    safetyRequirements: ["safety_vest", "hard_hat", "safety_glasses"],
    qualityStandards: ["no_cable_damage", "proper_tension", "adequate_slack"],
    isActive: true,
  },
  {
    code: "stage_6_splicing",
    name: {
      ru: "Сварка",
      de: "Spleißen",
      en: "Splicing",
      uz: "Payvandlash",
      tr: "Ekleme",
    },
    description: {
      ru: "Сварка оптических волокон",
      de: "Spleißen der Glasfasern",
      en: "Splicing of optical fibers",
      uz: "Optik tolalarni payvandlash",
      tr: "Optik fiberlerin eklenmesi",
    },
    requirements: {
      minPhotos: 6,
      maxPhotos: 15,
      requiredMeasurements: ["splice_loss", "fiber_count"],
      requiredGPS: true,
      qualityChecks: [
        "splice_loss_limits",
        "fiber_identification",
        "protection_sleeve_installation",
        "splice_tray_organization"
      ],
      materialUsage: [
        {
          materialCode: "splice_protectors",
          materialName: "Splice Protection Sleeves",
          quantity: 48,
          unit: "pieces",
          isOptional: false
        },
        {
          materialCode: "cleaning_fluid",
          materialName: "Fiber Cleaning Fluid",
          quantity: 1,
          unit: "bottle",
          isOptional: false
        },
      ],
      weatherRestrictions: [
        {
          condition: 'humidity',
          operator: 'above',
          value: 85,
          unit: 'percent',
          reason: 'High humidity affects splice quality'
        }
      ]
    },
    nextStages: ["stage_7_testing"],
    estimatedDuration: 180,
    requiredTools: ["fusion_splicer", "otdr", "fiber_cleaver", "splice_trays"],
    safetyRequirements: ["safety_vest", "hard_hat", "safety_glasses", "clean_environment"],
    qualityStandards: ["low_splice_loss", "proper_protection", "organized_layout"],
    isActive: true,
  },
  {
    code: "stage_7_testing",
    name: {
      ru: "Тестирование",
      de: "Prüfung",
      en: "Testing",
      uz: "Sinash",
      tr: "Test",
    },
    description: {
      ru: "Тестирование оптических линий",
      de: "Prüfung der Glasfaserverbindungen",
      en: "Testing of fiber optic connections",
      uz: "Optik aloqa liniyalarini sinash",
      tr: "Fiber optik bağlantıların testi",
    },
    requirements: {
      minPhotos: 4,
      maxPhotos: 8,
      requiredMeasurements: ["insertion_loss", "return_loss", "length"],
      requiredGPS: true,
      qualityChecks: [
        "power_levels",
        "link_continuity",
        "wavelength_response",
        "test_documentation"
      ],
      materialUsage: [],
      weatherRestrictions: [
        {
          condition: 'temperature',
          operator: 'below',
          value: -20,
          unit: 'celsius',
          reason: 'Equipment operating limits'
        }
      ]
    },
    nextStages: ["stage_8_documentation"],
    estimatedDuration: 90,
    requiredTools: ["power_meter", "light_source", "otdr", "test_leads"],
    safetyRequirements: ["safety_vest", "hard_hat", "laser_safety_glasses"],
    qualityStandards: ["acceptable_loss_levels", "complete_test_results", "proper_documentation"],
    isActive: true,
  },
  {
    code: "stage_8_documentation",
    name: {
      ru: "Документирование",
      de: "Dokumentation",
      en: "Documentation",
      uz: "Hujjatlash",
      tr: "Dokümantasyon",
    },
    description: {
      ru: "Подготовка документации по выполненным работам",
      de: "Erstellung der Dokumentation für abgeschlossene Arbeiten",
      en: "Preparation of documentation for completed work",
      uz: "Bajarilgan ishlar bo'yicha hujjatlar tayyorlash",
      tr: "Tamamlanan işler için dokümantasyon hazırlama",
    },
    requirements: {
      minPhotos: 2,
      maxPhotos: 5,
      requiredMeasurements: ["total_length"],
      requiredGPS: false,
      qualityChecks: [
        "document_completeness",
        "test_result_inclusion",
        "photo_quality",
        "signature_verification"
      ],
      materialUsage: [],
    },
    nextStages: ["stage_9_cleanup"],
    estimatedDuration: 45,
    requiredTools: ["camera", "document_templates", "measuring_tools"],
    safetyRequirements: ["safety_vest"],
    qualityStandards: ["complete_documentation", "accurate_measurements", "clear_photos"],
    isActive: true,
  },
  {
    code: "stage_9_cleanup",
    name: {
      ru: "Уборка",
      de: "Aufräumen",
      en: "Cleanup",
      uz: "Tozalash",
      tr: "Temizlik",
    },
    description: {
      ru: "Уборка рабочей зоны и вывоз мусора",
      de: "Aufräumen des Arbeitsbereichs und Müllentsorgung",
      en: "Cleanup of work area and waste disposal",
      uz: "Ish joyini tozalash va chiqindilarni olib ketish",
      tr: "Çalışma alanının temizlenmesi ve atık bertarafı",
    },
    requirements: {
      minPhotos: 2,
      maxPhotos: 4,
      requiredMeasurements: [],
      requiredGPS: true,
      qualityChecks: [
        "area_cleanliness",
        "waste_disposal",
        "tool_collection",
        "safety_restoration"
      ],
      materialUsage: [],
    },
    nextStages: ["stage_10_handover"],
    estimatedDuration: 30,
    requiredTools: ["cleaning_supplies", "waste_bags"],
    safetyRequirements: ["safety_vest", "gloves"],
    qualityStandards: ["clean_work_area", "proper_waste_disposal", "no_leftover_materials"],
    isActive: true,
  },
  {
    code: "stage_10_handover",
    name: {
      ru: "Сдача работ",
      de: "Übergabe",
      en: "Handover",
      uz: "Topshirish",
      tr: "Teslim",
    },
    description: {
      ru: "Сдача выполненных работ заказчику",
      de: "Übergabe der abgeschlossenen Arbeiten an den Kunden",
      en: "Handover of completed work to customer",
      uz: "Bajarilgan ishlarni buyurtmachiga topshirish",
      tr: "Tamamlanan işlerin müşteriye teslimi",
    },
    requirements: {
      minPhotos: 3,
      maxPhotos: 6,
      requiredMeasurements: [],
      requiredGPS: true,
      qualityChecks: [
        "customer_acceptance",
        "documentation_handover",
        "warranty_explanation",
        "contact_information"
      ],
      materialUsage: [],
    },
    nextStages: [],
    estimatedDuration: 60,
    requiredTools: ["documentation_package", "warranty_forms"],
    safetyRequirements: ["safety_vest"],
    qualityStandards: ["customer_satisfaction", "complete_handover", "proper_documentation"],
    isActive: true,
  },
];

// Service interfaces
export interface WorkStageService {
  getAvailableStages(projectId: string, currentStage?: string): Promise<WorkStage[]>;
  validateStageRequirements(stageCode: string, workEntry: Partial<WorkEntry>): Promise<StageValidationResult>;
  createWorkEntry(request: CreateWorkEntryRequest): Promise<WorkEntry>;
  approveWorkEntry(approval: WorkEntryApproval): Promise<WorkEntry>;
  getWorkEntries(projectId: string, filters?: WorkEntryFilters): Promise<WorkEntry[]>;
  getStageProgress(projectId: string, stageCode: string): Promise<StageProgress>;
}

export interface WorkEntryFilters {
  userId?: string;
  teamId?: string;
  stageCode?: string;
  status?: WorkEntryStatus;
  dateFrom?: Date;
  dateTo?: Date;
  segmentId?: string;
  houseId?: string;
}

export interface StageProgress {
  stageCode: string;
  totalEntries: number;
  completedEntries: number;
  approvedEntries: number;
  averageQualityScore: number;
  estimatedCompletion: Date;
  progressPercentage: number;
}