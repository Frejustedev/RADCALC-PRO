import { describe, it, expect } from 'vitest';
import {
  calculateDecay,
  calculateRequiredInitialActivity,
  calculateTimeToActivity,
  calculateBSA,
  calculateCreatinineClearance,
  calculatePediatricActivity,
  recommendActivity,
  calculateDrawVolume,
  estimateEffectiveDose,
  effectiveDoseCoefficient,
  resolveEffectiveCoefficient,
  organAbsorbedDose,
  isDoseAboveAlert,
  decayConstant,
  I131_COEFF_FUNCTIONING,
  I131_COEFF_BLOCKED,
} from './dosimetry';
import { ISOTOPES, getPediatricMultiplier } from '../constants';
import { Isotope, Protocol } from '../types';

const iso = (id: string): Isotope => ISOTOPES.find((i) => i.id === id)!;
const proto = (isoId: string, protoId: string): Protocol =>
  iso(isoId).protocols.find((p) => p.id === protoId)!;

const HALF_LIFE = 100;

describe('radioactive decay', () => {
  it('decay constant is ln2 / T½', () => {
    expect(decayConstant(HALF_LIFE)).toBeCloseTo(Math.LN2 / HALF_LIFE, 9);
    expect(decayConstant(0)).toBe(0);
  });

  it('A(0) = A₀ and A(T½) = A₀/2', () => {
    expect(calculateDecay(1000, HALF_LIFE, 0)).toBeCloseTo(1000, 6);
    expect(calculateDecay(1000, HALF_LIFE, HALF_LIFE)).toBeCloseTo(500, 6);
    expect(calculateDecay(1000, HALF_LIFE, 2 * HALF_LIFE)).toBeCloseTo(250, 6);
  });

  it('required initial activity is the inverse of decay', () => {
    expect(calculateRequiredInitialActivity(500, HALF_LIFE, HALF_LIFE)).toBeCloseTo(1000, 6);
    const back = calculateDecay(calculateRequiredInitialActivity(370, HALF_LIFE, 42), HALF_LIFE, 42);
    expect(back).toBeCloseTo(370, 6);
  });

  it('time to reach a target activity', () => {
    expect(calculateTimeToActivity(1000, 500, HALF_LIFE)).toBeCloseTo(HALF_LIFE, 6);
    expect(calculateTimeToActivity(1000, 2000, HALF_LIFE)).toBe(0); // target above initial
    expect(calculateTimeToActivity(0, 500, HALF_LIFE)).toBe(0);
  });
});

describe('biometrics', () => {
  it('Mosteller BSA', () => {
    expect(calculateBSA(70, 175)).toBeCloseTo(Math.sqrt((70 * 175) / 3600), 6);
    expect(calculateBSA(0, 175)).toBe(0);
  });

  it('Cockcroft-Gault clearance', () => {
    // 45y, 70kg, M, 80 µmol/L → ((140-45)*70*1.23)/80
    expect(calculateCreatinineClearance(45, 70, 'M', 80)).toBeCloseTo(((140 - 45) * 70 * 1.23) / 80, 4);
    // female factor is lower
    expect(calculateCreatinineClearance(45, 70, 'F', 80)).toBeLessThan(
      calculateCreatinineClearance(45, 70, 'M', 80),
    );
    expect(calculateCreatinineClearance(45, 70, 'M', 0)).toBe(0);
    expect(calculateCreatinineClearance(150, 70, 'M', 80)).toBe(0); // implausible age
  });
});

describe('EANM pediatric multipliers (3-class table)', () => {
  it('all classes are 1 at 3 kg', () => {
    expect(getPediatricMultiplier(3, 'A')).toBe(1);
    expect(getPediatricMultiplier(3, 'B')).toBe(1);
    expect(getPediatricMultiplier(3, 'C')).toBe(1);
  });

  it('classes diverge above 3 kg (A < B < C)', () => {
    expect(getPediatricMultiplier(50, 'A')).toBeLessThan(getPediatricMultiplier(50, 'B'));
    expect(getPediatricMultiplier(50, 'B')).toBeLessThan(getPediatricMultiplier(50, 'C'));
    expect(getPediatricMultiplier(50, 'B')).toBeCloseTo(10.71, 2);
  });

  it('defaults to class B and caps at 68 kg', () => {
    expect(getPediatricMultiplier(20)).toBe(getPediatricMultiplier(20, 'B'));
    expect(getPediatricMultiplier(999, 'B')).toBe(14);
  });
});

describe('pediatric activity (EANM baseline × multiple)', () => {
  it('uses baseline × multiple of the protocol class', () => {
    const r = calculatePediatricActivity(proto('f18', 'fdg-oncology'), 20); // baseline 25.9, class B, mult 4.86
    expect(r.supported).toBe(true);
    expect(r.activityMBq).toBeCloseTo(25.9 * 4.86, 2);
    expect(r.multiple).toBeCloseTo(4.86, 2);
  });

  it('enforces the minimum activity floor', () => {
    const r = calculatePediatricActivity(proto('tc99m', 'myocardial'), 3); // baseline 28, min 80, mult 1
    expect(r.activityMBq).toBe(80);
    expect(r.floorApplied).toBe(true);
  });

  it('selects the correct class column (MAG3 = A, thyroid-I123 = C)', () => {
    const mag3 = calculatePediatricActivity(proto('tc99m', 'renal-mag3'), 20); // A@20=2.88, base 11.9
    expect(mag3.activityMBq).toBeCloseTo(Math.max(11.9 * 2.88, 15), 2);
    const thy = calculatePediatricActivity(proto('i123', 'thyroid-i123'), 20); // C@20=8.33, base 0.6, min 3
    expect(thy.activityMBq).toBeCloseTo(Math.max(0.6 * 8.33, 3), 2);
  });

  it('reports unsupported when no EANM reference exists', () => {
    const r = calculatePediatricActivity(proto('f18', 'f-choline'), 20);
    expect(r.supported).toBe(false);
  });
});

describe('recommendActivity', () => {
  const base = { isPediatric: false, isDigitalPET: false } as const;

  it('adult dosing is weight × MBq/kg', () => {
    const r = recommendActivity({ ...base, protocol: proto('f18', 'f-choline'), isotope: iso('f18'), weightKg: 70 });
    expect(r.activityMBq).toBeCloseTo(70 * 2.5, 6);
  });

  it('REGRESSION (C2): pediatric is weight-aware, not MBq/kg × multiple', () => {
    const weightKg = 20;
    const r = recommendActivity({ ...base, isPediatric: true, protocol: proto('f18', 'fdg-oncology'), isotope: iso('f18'), weightKg });
    const oldBug = proto('f18', 'fdg-oncology').activityMBqPerKg * getPediatricMultiplier(weightKg, 'B'); // 3.5 × 4.86 ≈ 17
    expect(r.activityMBq).toBeCloseTo(25.9 * 4.86, 1); // ≈ 125.9 MBq
    expect(r.activityMBq).toBeGreaterThan(oldBug * 5);
  });

  it('applies the digital PET reduction for 18F', () => {
    const r = recommendActivity({ ...base, isDigitalPET: true, protocol: proto('f18', 'fdg-oncology'), isotope: iso('f18'), weightKg: 70 });
    expect(r.activityMBq).toBeCloseTo(70 * 3.5 * 0.6, 4);
  });

  it('uses fixed activity for DaTSCAN (adult, not weight-based)', () => {
    const r = recommendActivity({ ...base, protocol: proto('i123', 'datscan'), isotope: iso('i123'), weightKg: 70 });
    expect(r.isFixedActivity).toBe(true);
    expect(r.activityMBq).toBe(150);
  });

  it('does NOT give a child the full adult fixed activity (DaTSCAN paediatric guard)', () => {
    const r = recommendActivity({ ...base, isPediatric: true, protocol: proto('i123', 'datscan'), isotope: iso('i123'), weightKg: 15 });
    expect(r.activityMBq).not.toBe(150);
    expect(r.activityMBq).toBeCloseTo(15 * 2.5, 4);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('halves the MAG3 activity in severe renal impairment', () => {
    const r = recommendActivity({ ...base, protocol: proto('tc99m', 'renal-mag3'), isotope: iso('tc99m'), weightKg: 70, renalClearanceMlMin: 20 });
    expect(r.renalAdjustmentFactor).toBe(0.5);
    expect(r.activityMBq).toBeCloseTo(70 * 1.5 * 0.5, 4);
  });
});

describe('draw volume', () => {
  it('computes base and total (with dead volume)', () => {
    const r = calculateDrawVolume(3700, 10, 370, 0.1); // 370 MBq/mL → 1 mL + 0.1 dead
    expect(r.concentrationMBqPerMl).toBeCloseTo(370, 6);
    expect(r.baseVolumeMl).toBeCloseTo(1, 6);
    expect(r.totalVolumeMl).toBeCloseTo(1.1, 6);
  });

  it('REGRESSION (C1): mCi vial input must be converted to MBq first → no ×37 error', () => {
    // Vial labelled 100 mCi (=3700 MBq) in 10 mL, target 370 MBq.
    const withMBq = calculateDrawVolume(3700, 10, 370);
    expect(withMBq.baseVolumeMl).toBeCloseTo(1, 6);
    // The old bug divided 370 MBq by a 10 mCi/mL concentration → 37 mL.
    expect(withMBq.baseVolumeMl).not.toBeCloseTo(37, 0);
  });

  it('returns zeros for invalid inputs', () => {
    expect(calculateDrawVolume(0, 10, 370)).toEqual({ baseVolumeMl: 0, totalVolumeMl: 0, concentrationMBqPerMl: 0 });
    expect(calculateDrawVolume(3700, 0, 370).totalVolumeMl).toBe(0);
  });
});

describe('effective dose & coefficients', () => {
  it('protocol coefficient overrides isotope default', () => {
    expect(effectiveDoseCoefficient(iso('tc99m'), proto('tc99m', 'bone-scan'))).toBe(0.0049);
    expect(effectiveDoseCoefficient(iso('tc99m'))).toBe(0.009); // fallback
  });

  it('I-131 branches on thyroid status (~90× difference)', () => {
    expect(resolveEffectiveCoefficient(iso('i131'), proto('i131', 'thyroid-imaging'))).toBe(I131_COEFF_FUNCTIONING);
    expect(resolveEffectiveCoefficient(iso('i131'), proto('i131', 'thyroid-imaging'), { thyroidBlocked: true })).toBe(I131_COEFF_BLOCKED);
    expect(I131_COEFF_FUNCTIONING / I131_COEFF_BLOCKED).toBeGreaterThan(50);
  });

  it('an explicit protocol coefficient override takes precedence', () => {
    // tc99m bone-scan carries an override (0.0049) → used over the isotope default (0.009)
    expect(resolveEffectiveCoefficient(iso('tc99m'), proto('tc99m', 'bone-scan'))).toBe(0.0049);
  });

  it('effective dose = activity × coefficient', () => {
    expect(estimateEffectiveDose(100, iso('f18'))).toBeCloseTo(1.9, 6);
  });

  it('organ absorbed dose (mGy)', () => {
    expect(organAbsorbedDose(100, 0.13)).toBeCloseTo(13, 6);
  });

  it('dose alert only fires for diagnostic isotopes', () => {
    expect(isDoseAboveAlert(20, iso('f18'))).toBe(true);
    expect(isDoseAboveAlert(10, iso('f18'))).toBe(false);
    expect(isDoseAboveAlert(99999, iso('i131'))).toBe(false); // therapy → suppressed
  });
});
