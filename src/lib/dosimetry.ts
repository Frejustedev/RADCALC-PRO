/**
 * Dosimetry calculation engine — pure, side-effect-free, fully unit-tested.
 *
 * All activities are in **MBq**, all times in **minutes**, organ absorbed doses
 * in **mGy** and effective dose in **mSv**. Conversion to the user's display
 * unit happens only in the UI layer (see lib/units.ts).
 */
import { Isotope, Protocol, OrganDose } from '../types';
import { getPediatricMultiplier } from '../constants';

/** Digital PET sensitivity gain → ~40% activity reduction for 18F protocols. */
export const DIGITAL_PET_FACTOR = 0.6;
/** Activity reduction applied to renal protocols in severe renal impairment. */
export const RENAL_REDUCTION_FACTOR = 0.5;
export const SEVERE_RENAL_CLCR = 30; // ml/min
/** Effective-dose alert threshold for *diagnostic* exams (mSv). */
export const DIAGNOSTIC_DOSE_ALERT_MSV = 15;
/** Age (years) below which a patient is auto-classified paediatric (EANM); overridable in the form. */
export const PEDIATRIC_AGE_THRESHOLD = 16;
/** I-131 iodide effective-dose coefficients (mSv/MBq): functioning vs blocked thyroid (ICRP 128). */
export const I131_COEFF_FUNCTIONING = 22;
export const I131_COEFF_BLOCKED = 0.24;
/** I-131 thyroid ABSORBED-dose coefficients (mGy/MBq): functioning (~35% uptake) vs blocked (ICRP 128). */
export const I131_THYROID_MGY_FUNCTIONING = 430;
export const I131_THYROID_MGY_BLOCKED = 2.2;

// ── Radioactive decay ───────────────────────────────────────────────────────

/** Decay constant λ = ln(2) / T½. Returns 0 for non-physical half-lives. */
export const decayConstant = (halfLifeMinutes: number): number =>
  halfLifeMinutes > 0 ? Math.LN2 / halfLifeMinutes : 0;

/** A(t) = A₀·e^(−λt). */
export const calculateDecay = (
  initialActivity: number,
  halfLifeMinutes: number,
  timeElapsedMinutes: number,
): number => initialActivity * Math.exp(-decayConstant(halfLifeMinutes) * timeElapsedMinutes);

/** A₀ needed now to still have `targetActivity` after `timeToInjectionMinutes`. */
export const calculateRequiredInitialActivity = (
  targetActivity: number,
  halfLifeMinutes: number,
  timeToInjectionMinutes: number,
): number => targetActivity * Math.exp(decayConstant(halfLifeMinutes) * timeToInjectionMinutes);

/** Time (min) for `initialActivity` to decay down to `targetActivity`. */
export const calculateTimeToActivity = (
  initialActivity: number,
  targetActivity: number,
  halfLifeMinutes: number,
): number => {
  if (initialActivity <= 0 || targetActivity <= 0 || targetActivity >= initialActivity) return 0;
  const lambda = decayConstant(halfLifeMinutes);
  if (lambda === 0) return 0;
  return -Math.log(targetActivity / initialActivity) / lambda;
};

// ── Patient biometrics ──────────────────────────────────────────────────────

/** Mosteller BSA (m²) = √(H·W / 3600). */
export const calculateBSA = (weightKg: number, heightCm: number): number => {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  return Math.sqrt((weightKg * heightCm) / 3600);
};

/**
 * Cockcroft-Gault creatinine clearance (ml/min), µmol/L variant.
 * ClCr = ((140 − age)·weight·k) / creatinine, k = 1.23 (M) / 1.04 (F).
 * NB: this is a creatinine clearance, *not* a BSA-normalised eGFR.
 */
export const calculateCreatinineClearance = (
  age: number,
  weightKg: number,
  gender: 'M' | 'F',
  creatinineUmolL: number,
): number => {
  if (creatinineUmolL <= 0 || age < 0 || age >= 140 || weightKg <= 0) return 0;
  const k = gender === 'M' ? 1.23 : 1.04;
  return Math.max(0, ((140 - age) * weightKg * k) / creatinineUmolL);
};

// ── Recommended activity ────────────────────────────────────────────────────

export interface PediatricResult {
  supported: boolean;
  activityMBq: number;
  multiple: number;
  baselineMBq: number;
  floorApplied: boolean; // true if the EANM minimum activity overrode the computed value
}

/**
 * EANM Paediatric Dosage Card method:
 *   Administered activity [MBq] = Baseline activity [MBq] × Multiple(weight),
 *   then clamped up to the radiopharmaceutical's minimum activity.
 *
 * This is dimensionally correct (baseline is an activity in MBq, the multiple is
 * dimensionless) — unlike a naive `MBq/kg × multiple`, which ignores body weight.
 */
export const calculatePediatricActivity = (protocol: Protocol, weightKg: number): PediatricResult => {
  const ped = protocol.pediatric;
  if (!ped || weightKg <= 0) {
    return { supported: false, activityMBq: 0, multiple: 0, baselineMBq: 0, floorApplied: false };
  }
  const multiple = getPediatricMultiplier(weightKg, ped.eanmClass as 'A' | 'B' | 'C' | undefined);
  const raw = ped.baselineMBq * multiple;
  const activityMBq = Math.max(raw, ped.minMBq);
  return {
    supported: true,
    activityMBq,
    multiple,
    baselineMBq: ped.baselineMBq,
    floorApplied: activityMBq > raw,
  };
};

export interface RecommendationInput {
  protocol: Protocol;
  isotope: Isotope;
  weightKg: number;
  isPediatric: boolean;
  isDigitalPET: boolean;
  renalClearanceMlMin?: number;
}

export interface Adjustment {
  label: string;
  factor?: number;
  detail?: string;
}

export interface Recommendation {
  activityMBq: number;
  adjustments: Adjustment[];
  pediatricFloorApplied: boolean;
  isFixedActivity: boolean;
  renalAdjustmentFactor?: number;
  warnings: string[];
}

/**
 * Central activity recommendation used by the app — testable in isolation.
 * Adult: weight × (MBq/kg). Paediatric: EANM baseline × multiple (with min).
 * Then optional digital-PET and renal modifiers.
 */
export const recommendActivity = (input: RecommendationInput): Recommendation => {
  const { protocol, isotope, weightKg, isPediatric, isDigitalPET, renalClearanceMlMin } = input;
  const adjustments: Adjustment[] = [];
  const warnings: string[] = [];
  let activityMBq = 0;
  let pediatricFloorApplied = false;
  let isFixedActivity = false;

  if (isPediatric) {
    const ped = calculatePediatricActivity(protocol, weightKg);
    if (ped.supported) {
      activityMBq = ped.activityMBq;
      pediatricFloorApplied = ped.floorApplied;
      adjustments.push({
        label: `EANM pédiatrique (classe ${protocol.pediatric?.eanmClass ?? 'B'})`,
        detail: `${ped.baselineMBq} MBq × ${ped.multiple.toFixed(2)}${ped.floorApplied ? ' (min. appliqué)' : ''}`,
      });
    } else if (protocol.fixedActivityMBq !== undefined) {
      // Adult-only fixed-activity protocol (e.g. DaTSCAN) with no paediatric reference:
      // do NOT hand a child the full adult fixed activity. Show weight-based as a placeholder
      // and flag that this protocol has no validated paediatric dosing.
      activityMBq = weightKg * protocol.activityMBqPerKg;
      warnings.push(
        "Protocole à activité fixe adulte sans référentiel pédiatrique validé : ne pas administrer l'activité adulte à un enfant. Estimation au prorata du poids, à valider impérativement.",
      );
    } else {
      // No EANM baseline for this protocol → transparent fallback, flagged loudly.
      activityMBq = weightKg * protocol.activityMBqPerKg;
      warnings.push(
        "Aucun référentiel EANM pédiatrique pour ce protocole : estimation adulte au prorata du poids, à valider impérativement.",
      );
    }
  } else if (protocol.fixedActivityMBq !== undefined) {
    // Fixed adult activity (DaTSCAN, therapy) — not weight-based.
    activityMBq = protocol.fixedActivityMBq;
    isFixedActivity = true;
    adjustments.push({ label: 'Activité fixe (protocole)', detail: `${protocol.fixedActivityMBq} MBq` });
    warnings.push('Activité de référence fixe : à individualiser/valider (dosimétrie, RCP, DRL locaux).');
  } else {
    activityMBq = weightKg * protocol.activityMBqPerKg;
  }

  if (isDigitalPET && isotope.id === 'f18' && !isFixedActivity) {
    activityMBq *= DIGITAL_PET_FACTOR;
    adjustments.push({ label: 'PET digital', factor: DIGITAL_PET_FACTOR });
  }

  let renalAdjustmentFactor: number | undefined;
  if (
    protocol.id === 'renal-mag3' &&
    renalClearanceMlMin !== undefined &&
    renalClearanceMlMin < SEVERE_RENAL_CLCR
  ) {
    activityMBq *= RENAL_REDUCTION_FACTOR;
    renalAdjustmentFactor = RENAL_REDUCTION_FACTOR;
    adjustments.push({ label: 'Ajustement rénal', factor: RENAL_REDUCTION_FACTOR });
  }

  return {
    activityMBq: Math.max(0, activityMBq),
    adjustments,
    pediatricFloorApplied,
    isFixedActivity,
    renalAdjustmentFactor,
    warnings,
  };
};

// ── Vial / draw volume ──────────────────────────────────────────────────────

export interface DrawVolume {
  baseVolumeMl: number; // volume delivering the required activity
  totalVolumeMl: number; // base + dead volume (what to actually draw up)
  concentrationMBqPerMl: number;
}

/**
 * Volume to draw from a vial. **Everything is MBq** — callers must convert any
 * mCi user input to MBq first (lib/units.toMBq) so concentration and required
 * activity share the same unit (this was the source of a ×37 error).
 */
export const calculateDrawVolume = (
  vialActivityMBq: number,
  vialVolumeMl: number,
  requiredActivityMBq: number,
  deadVolumeMl = 0,
): DrawVolume => {
  if (vialActivityMBq <= 0 || vialVolumeMl <= 0 || requiredActivityMBq <= 0) {
    return { baseVolumeMl: 0, totalVolumeMl: 0, concentrationMBqPerMl: 0 };
  }
  const concentrationMBqPerMl = vialActivityMBq / vialVolumeMl;
  const baseVolumeMl = requiredActivityMBq / concentrationMBqPerMl;
  const totalVolumeMl = baseVolumeMl + Math.max(0, deadVolumeMl);
  return { baseVolumeMl, totalVolumeMl, concentrationMBqPerMl };
};

// ── Dose ────────────────────────────────────────────────────────────────────

/** Effective-dose coefficient (mSv/MBq): tracer-specific override or isotope default. */
export const effectiveDoseCoefficient = (isotope: Isotope, protocol?: Protocol): number =>
  protocol?.doseCoefficientMSvPerMBq ?? isotope.doseCoefficientMSvPerMBq;

/**
 * Effective-dose coefficient resolved for the clinical scenario. For I-131 iodide
 * the coefficient depends on thyroid status (functioning vs blocked) — a ~90× difference.
 */
export const resolveEffectiveCoefficient = (
  isotope: Isotope,
  protocol?: Protocol,
  opts?: { thyroidBlocked?: boolean },
): number => {
  // An explicit protocol override always wins.
  if (protocol?.doseCoefficientMSvPerMBq !== undefined) return protocol.doseCoefficientMSvPerMBq;
  // I-131 iodide effective dose is uptake-dependent (functioning thyroid by default).
  if (isotope.id === 'i131') {
    return opts?.thyroidBlocked ? I131_COEFF_BLOCKED : I131_COEFF_FUNCTIONING;
  }
  return effectiveDoseCoefficient(isotope, protocol);
};

/** Whole-body effective dose (mSv) = activity (MBq) × e (mSv/MBq). */
export const estimateEffectiveDose = (
  activityMBq: number,
  isotope: Isotope,
  protocol?: Protocol,
): number => activityMBq * effectiveDoseCoefficient(isotope, protocol);

/** Organ absorbed dose (mGy) = activity (MBq) × coefficient (mGy/MBq). */
export const organAbsorbedDose = (activityMBq: number, coefficientMGyPerMBq: number): number =>
  activityMBq * coefficientMGyPerMBq;

/**
 * Is this a therapeutic administration? Uses the explicit protocol intent, else falls back
 * to a therapy isotope dosed at a fixed (ablative) activity.
 */
export const isTherapeuticProtocol = (isotope: Isotope, protocol?: Protocol): boolean => {
  if (protocol?.intent) return protocol.intent === 'therapeutic';
  return isotope.type === 'Therapy' && protocol?.fixedActivityMBq !== undefined;
};

/**
 * Dose-alert on clinical INTENT, not isotope type: a *diagnostic* I-131 thyroid scan
 * genuinely reaches ~150 mSv and MUST alert, while a therapeutic administration does not
 * use the effective-dose alert at all (organ absorbed dose governs).
 */
export const isDoseAboveAlert = (
  effectiveDoseMSv: number,
  isotope: Isotope,
  protocol?: Protocol,
  thresholdMSv: number = DIAGNOSTIC_DOSE_ALERT_MSV,
): boolean => !isTherapeuticProtocol(isotope, protocol) && effectiveDoseMSv > thresholdMSv;

/**
 * Organ absorbed-dose coefficients for the scenario. For I-131 the thyroid coefficient
 * tracks the same thyroid-blocked flag as the effective dose (~195× difference), so the
 * organ chart can never contradict the effective dose shown next to it.
 */
export const resolveOrganCoefficients = (
  isotope: Isotope,
  protocol?: Protocol,
  opts?: { thyroidBlocked?: boolean },
): OrganDose[] => {
  const base = protocol?.organDoses ?? isotope.organDoses ?? [];
  if (isotope.id !== 'i131') return base;
  return base.map((od) =>
    od.organ === 'Thyroïde'
      ? { ...od, coefficientMGyPerMBq: opts?.thyroidBlocked ? I131_THYROID_MGY_BLOCKED : I131_THYROID_MGY_FUNCTIONING }
      : od,
  );
};

/** Rule-of-thumb storage-for-decay duration: ~10 half-lives, expressed in days. */
export const decayStorageDays = (halfLifeMinutes: number): number => (halfLifeMinutes * 10) / 1440;
