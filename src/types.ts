import type { Role } from './lib/roles';

export type Unit = 'MBq' | 'mCi';

/** EANM Paediatric Dosage Card reference for a given radiopharmaceutical. */
export interface PediatricReference {
  baselineMBq: number; // EANM baseline activity
  minMBq: number; // minimum recommended activity
  eanmClass?: string; // EANM class (A / B / C)
  source?: string;
}

export interface Protocol {
  id: string;
  name: string;
  activityMBqPerKg: number; // adult, weight-based
  description?: string;
  /** Clinical intent — drives dose-alert logic (default 'diagnostic'). */
  intent?: 'diagnostic' | 'therapeutic';
  /** Optional tracer-specific effective-dose coefficient (mSv/MBq); overrides the isotope default. */
  doseCoefficientMSvPerMBq?: number;
  /** Fixed adult activity (MBq) when dosing is not weight-based (e.g. DaTSCAN, therapy). */
  fixedActivityMBq?: number;
  /** Protocol-level organ absorbed doses; overrides the isotope defaults (different biodistribution). */
  organDoses?: OrganDose[];
  pediatric?: PediatricReference; // present when EANM paediatric dosing is defined
}

export interface OrganDose {
  organ: string;
  /** Absorbed dose coefficient in **mGy/MBq** (organ absorbed dose, not effective dose). */
  coefficientMGyPerMBq: number;
}

export interface Isotope {
  id: string;
  name: string;
  halfLifeMinutes: number;
  /** Whole-body effective dose coefficient in **mSv/MBq** (ICRP). */
  doseCoefficientMSvPerMBq: number;
  commonUsage: string;
  protocols: Protocol[];
  organDoses?: OrganDose[];
  type: 'PET' | 'SPECT' | 'Therapy';
}

export interface PatientData {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'M' | 'F';
  creatinine?: number; // µmol/L
  clcr?: number; // ml/min (Cockcroft-Gault creatinine clearance)
  bsa: number; // m²
  isPediatric: boolean;
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
}

export interface Vial {
  id: string;
  isotopeId: string;
  initialActivity: number; // MBq
  initialVolume: number; // mL
  referenceTime: string; // ISO
  lotNumber?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
}

// ── Firestore-backed records (single center: IMeNA, Côte d'Ivoire) ───────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Patient {
  id: string;
  dossierNumber?: string;
  firstName: string;
  lastName: string;
  birthDate?: string; // ISO date
  gender: 'M' | 'F';
  weight: number; // kg
  height: number; // cm
  age: number; // years
  creatinine?: number; // µmol/L
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExamStatus = 'draft' | 'validated';

export interface Exam {
  id: string;
  patientId: string;
  patientName: string;
  isotopeId: string;
  isotopeName: string;
  protocolId: string;
  protocolName: string;
  unit: Unit;
  recommendedActivityMBq: number;
  /** Decay-corrected activity to draw at the planned injection time (if a delay was set). */
  administeredActivityMBq?: number;
  effectiveDoseMSv: number;
  effectiveCoefficientUsed?: number;
  isDigitalPET?: boolean;
  thyroidBlocked?: boolean;
  renalAdjustmentFactor?: number;
  patientSnapshot: {
    weight: number;
    height: number;
    age: number;
    gender: 'M' | 'F';
    isPediatric: boolean;
    creatinine?: number;
    clcr?: number;
    bsa?: number;
    isPregnant?: boolean;
    isBreastfeeding?: boolean;
  };
  status: ExamStatus;
  performedBy: string;
  performedByName: string;
  validatedBy?: string;
  validatedByName?: string;
  validatedAt?: string;
  createdAt: string;
}

export interface VialData {
  activity: number; // expressed in the currently selected display Unit
  volume: number; // mL
  referenceTime: string; // ISO string or simple HH:mm
  deadVolume?: number; // mL
}

export interface CalculationResults {
  recommendedActivity: number; // MBq (canonical)
  estimatedEffectiveDose: number; // mSv
  effectiveCoefficientUsed?: number; // mSv/MBq actually applied
  decayedActivity?: number; // MBq
  initialActivityNeeded?: number; // MBq
  volumeToDraw?: number; // mL
  organDoses?: { organ: string; dose: number }[]; // mGy
  isDigitalPET?: boolean;
  isFixedActivity?: boolean;
  renalAdjustmentFactor?: number;
  pediatricFloorApplied?: boolean;
  thyroidBlocked?: boolean;
  warnings?: string[];
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
}

