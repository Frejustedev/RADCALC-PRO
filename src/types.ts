export type Unit = 'MBq' | 'mCi';

export interface Protocol {
  id: string;
  name: string;
  activityMBqPerKg: number;
  description?: string;
}

export interface Isotope {
  id: string;
  name: string;
  halfLifeMinutes: number;
  doseCoefficientMSvPerMBq: number;
  commonUsage: string;
  protocols: Protocol[];
  organDoses?: {
    organ: string;
    coefficient: number; // mSv/MBq
  }[];
  type: 'PET' | 'SPECT' | 'Therapy';
}

export interface PatientData {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'M' | 'F';
  creatinine?: number; // µmol/L
  egfr?: number; // ml/min/1.73m2
  bsa: number; // m2
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
}

export interface VialData {
  activity: number;
  volume: number;
  referenceTime: string; // ISO string or simple HH:mm
  deadVolume?: number; // mL
}

export interface CalculationResults {
  recommendedActivity: number; // MBq
  estimatedEffectiveDose: number; // mSv
  decayedActivity?: number; // MBq
  initialActivityNeeded?: number; // MBq
  volumeToDraw?: number; // mL
  organDoses?: { organ: string; dose: number }[];
  isDigitalPET?: boolean;
  renalAdjustmentFactor?: number;
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  patientData: PatientData;
  isotope: Isotope;
  protocol: Protocol;
  results: CalculationResults;
  unit: Unit;
  isDigitalPET?: boolean;
  renalAdjustmentFactor?: number;
}
