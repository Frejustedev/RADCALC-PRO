import { Isotope } from "./types";

export const MBQ_TO_MCI = 0.027027;
export const MCI_TO_MBQ = 37;

export const ISOTOPES: Isotope[] = [
  {
    id: "f18",
    name: "F-18 (Fluorine-18)",
    type: "PET",
    halfLifeMinutes: 109.7,
    doseCoefficientMSvPerMBq: 0.019,
    commonUsage: "PET Imaging (FDG)",
    protocols: [
      { id: "fdg-oncology", name: "TEP FDG Oncologie", activityMBqPerKg: 3.5, description: "Protocole standard corps entier" },
      { id: "fdg-brain", name: "TEP FDG Cerveau", activityMBqPerKg: 2.0, description: "Protocole neurologique" },
      { id: "f-choline", name: "F-Choline Prostate", activityMBqPerKg: 2.5, description: "Imagerie prostatique" },
      { id: "f-dopa", name: "F-DOPA Parkinson", activityMBqPerKg: 2.0, description: "Troubles du mouvement" },
      { id: "f-psma", name: "F-PSMA Prostate", activityMBqPerKg: 3.0, description: "PET/CT Prostate" },
    ],
    organDoses: [
      { organ: "Vessie", coefficient: 0.13 },
      { organ: "Cœur", coefficient: 0.022 },
      { organ: "Cerveau", coefficient: 0.011 },
      { organ: "Foie", coefficient: 0.012 },
      { organ: "Rate", coefficient: 0.011 },
    ]
  },
  {
    id: "ga68",
    name: "Ga-68 (Gallium-68)",
    type: "PET",
    halfLifeMinutes: 67.7,
    doseCoefficientMSvPerMBq: 0.024,
    commonUsage: "PET Imaging (PSMA/DOTATOC)",
    protocols: [
      { id: "ga-psma", name: "Ga-68 PSMA-11", activityMBqPerKg: 2.0, description: "Bilan cancer prostate" },
      { id: "ga-dotatoc", name: "Ga-68 DOTATOC/TATE", activityMBqPerKg: 2.0, description: "Tumeurs neuroendocrines" },
    ],
    organDoses: [
      { organ: "Reins", coefficient: 0.091 },
      { organ: "Vessie", coefficient: 0.12 },
      { organ: "Foie", coefficient: 0.015 },
      { organ: "Rate", coefficient: 0.02 },
    ]
  },
  {
    id: "tc99m",
    name: "Tc-99m (Technetium-99m)",
    type: "SPECT",
    halfLifeMinutes: 360.6,
    doseCoefficientMSvPerMBq: 0.009,
    commonUsage: "SPECT Scintigraphy",
    protocols: [
      { id: "bone-scan", name: "Scintigraphie Osseuse", activityMBqPerKg: 7.0, description: "Examen standard (HDP/MDP)" },
      { id: "myocardial", name: "Scintigraphie Myocardique", activityMBqPerKg: 8.0, description: "Protocole effort/repos" },
      { id: "renal-mag3", name: "Scintigraphie Rénale (MAG3)", activityMBqPerKg: 1.5, description: "Néphrologie" },
      { id: "thyroid-tc", name: "Scintigraphie Thyroïdienne", activityMBqPerKg: 1.0, description: "Bilan nodule" },
      { id: "lung-perf", name: "Perfusion Pulmonaire", activityMBqPerKg: 2.0, description: "Embolie pulmonaire" },
    ],
    organDoses: [
      { organ: "Côlon", coefficient: 0.037 },
      { organ: "Vessie", coefficient: 0.024 },
      { organ: "Reins", coefficient: 0.007 },
      { organ: "Poumons", coefficient: 0.015 },
      { organ: "Foie", coefficient: 0.004 },
    ]
  },
  {
    id: "i123",
    name: "I-123 (Iodine-123)",
    type: "SPECT",
    halfLifeMinutes: 793.2,
    doseCoefficientMSvPerMBq: 0.011,
    commonUsage: "SPECT Imaging",
    protocols: [
      { id: "datscan", name: "DaTSCAN (Parkinson)", activityMBqPerKg: 2.5, description: "Imagerie des transporteurs dopaminergiques" },
      { id: "mibg-imaging", name: "MIBG (Neuroblastome)", activityMBqPerKg: 5.0, description: "Imagerie sympathique" },
      { id: "thyroid-i123", name: "Thyroïde I-123", activityMBqPerKg: 0.2, description: "Fixation thyroïdienne" },
    ],
    organDoses: [
      { organ: "Vessie", coefficient: 0.04 },
      { organ: "Thyroïde", coefficient: 0.21 },
      { organ: "Cerveau", coefficient: 0.005 },
    ]
  },
  {
    id: "i131",
    name: "I-131 (Iodine-131)",
    type: "Therapy",
    halfLifeMinutes: 11548.8,
    doseCoefficientMSvPerMBq: 0.22,
    commonUsage: "Thyroid Therapy/Imaging",
    protocols: [
      { id: "thyroid-imaging", name: "Imagerie Thyroïdienne", activityMBqPerKg: 0.1, description: "Diagnostic (faible dose)" },
      { id: "thyroid-therapy", name: "Thérapie Thyroïdienne", activityMBqPerKg: 50.0, description: "Ablation/Traitement (forte dose)" },
    ],
    organDoses: [
      { organ: "Thyroïde", coefficient: 260 },
      { organ: "Estomac", coefficient: 0.46 },
      { organ: "Vessie", coefficient: 0.6 },
    ]
  },
  {
    id: "lu177",
    name: "Lu-177 (Lutetium-177)",
    type: "Therapy",
    halfLifeMinutes: 9561.6,
    doseCoefficientMSvPerMBq: 0.11,
    commonUsage: "Theranostics",
    protocols: [
      { id: "psma-therapy", name: "Thérapie PSMA", activityMBqPerKg: 100, description: "Cancer de la prostate" },
      { id: "dotatate-therapy", name: "Thérapie DOTATATE", activityMBqPerKg: 100, description: "Tumeurs neuroendocrines" },
    ],
    organDoses: [
      { organ: "Reins", coefficient: 0.65 },
      { organ: "Moelle", coefficient: 0.03 },
      { organ: "Foie", coefficient: 0.05 },
      { organ: "Rate", coefficient: 0.04 },
    ]
  },
  {
    id: "tl201",
    name: "Tl-201 (Thallium-201)",
    type: "SPECT",
    halfLifeMinutes: 4377.6,
    doseCoefficientMSvPerMBq: 0.23,
    commonUsage: "Myocardial Perfusion",
    protocols: [
      { id: "tl-myocardial", name: "Perfusion Myocardique", activityMBqPerKg: 1.5, description: "Viabilité myocardique" },
    ],
    organDoses: [
      { organ: "Reins", coefficient: 1.2 },
      { organ: "Cœur", coefficient: 0.17 },
      { organ: "Foie", coefficient: 0.12 },
      { organ: "Vessie", coefficient: 0.08 },
    ]
  },
];

/**
 * Calculate time needed to reach a target activity
 * t = -ln(A/A0) / lambda
 */
export const calculateTimeToActivity = (initialActivity: number, targetActivity: number, halfLifeMinutes: number): number => {
  if (initialActivity <= 0 || targetActivity <= 0 || targetActivity >= initialActivity) return 0;
  const lambda = Math.LN2 / halfLifeMinutes;
  return -Math.log(targetActivity / initialActivity) / lambda;
};

/**
 * EANM Pediatric Dosage Card Multipliers
 * Based on weight (kg)
 */
export const PEDIATRIC_MULTIPLIERS: Record<number, number> = {
  3: 1, 4: 1.14, 6: 1.43, 8: 1.71, 10: 2, 12: 2.29, 14: 2.57, 16: 2.86, 
  18: 3.14, 20: 3.43, 22: 3.71, 24: 4, 26: 4.29, 28: 4.57, 30: 4.86,
  32: 5.14, 34: 5.43, 36: 5.71, 38: 6, 40: 6.29, 42: 6.57, 44: 6.86,
  46: 7.14, 48: 7.43, 50: 7.71, 52: 8, 54: 8.29, 56: 8.57, 58: 8.86,
  60: 9.14, 62: 9.43, 64: 9.71, 66: 10, 68: 10.29
};

export const getPediatricMultiplier = (weight: number): number => {
  const weights = Object.keys(PEDIATRIC_MULTIPLIERS).map(Number).sort((a, b) => a - b);
  for (const w of weights) {
    if (weight <= w) return PEDIATRIC_MULTIPLIERS[w];
  }
  return PEDIATRIC_MULTIPLIERS[68];
};

/**
 * Cockcroft-Gault Formula for Creatinine Clearance
 * ClCr (ml/min) = ((140 - age) * weight * k) / creatinine(µmol/L)
 * k = 1.23 for men, 1.04 for women
 */
export const calculateCreatinineClearance = (age: number, weight: number, gender: 'M' | 'F', creatinineUmoll: number): number => {
  if (creatinineUmoll <= 0) return 0;
  const k = gender === 'M' ? 1.23 : 1.04;
  return ((140 - age) * weight * k) / creatinineUmoll;
};

/**
 * Mosteller Formula for Body Surface Area (BSA)
 * BSA (m²) = sqrt( (Height(cm) * Weight(kg)) / 3600 )
 */
export const calculateBSA = (weight: number, height: number): number => {
  if (weight <= 0 || height <= 0) return 0;
  return Math.sqrt((weight * height) / 3600);
};

/**
 * Radioactive Decay Formula
 * A = A0 * exp(-lambda * t)
 * lambda = ln(2) / T1/2
 */
export const calculateDecay = (initialActivity: number, halfLifeMinutes: number, timeElapsedMinutes: number): number => {
  const lambda = Math.LN2 / halfLifeMinutes;
  return initialActivity * Math.exp(-lambda * timeElapsedMinutes);
};

/**
 * Calculate Activity from target time
 * If we want activity A at time t, we need A0 at time 0
 * A0 = A / exp(-lambda * t) = A * exp(lambda * t)
 */
export const calculateRequiredInitialActivity = (targetActivity: number, halfLifeMinutes: number, timeToInjectionMinutes: number): number => {
  const lambda = Math.LN2 / halfLifeMinutes;
  return targetActivity * Math.exp(lambda * timeToInjectionMinutes);
};
