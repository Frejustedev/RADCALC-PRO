import { Isotope } from "./types";

/**
 * Reference data for RadCalc Pro — values cross-checked against ICRP 128 and the
 * EANM Paediatric Dosage Card v5.7 (2016) / IAEA Atlas. See AUDIT.md / docs.
 *
 * - isotope.doseCoefficientMSvPerMBq = whole-body EFFECTIVE dose (mSv/MBq), ICRP 128.
 * - protocol.doseCoefficientMSvPerMBq = tracer-specific override (Tc-99m & I-123 vary widely).
 * - organDoses[].coefficientMGyPerMBq = organ ABSORBED dose (mGy/MBq) — NOT effective dose.
 * - protocol.pediatric = EANM card: activity = baseline × multiple(weight, class), min enforced.
 * - protocol.fixedActivityMBq = fixed adult activity (not weight-based; e.g. DaTSCAN, therapy).
 *
 * ⚠️ Defaults only. Validate against current ICRP/EANM publications and local DRLs
 *    before any clinical use. I-131 effective dose branches on thyroid uptake (see App).
 */
export const ISOTOPES: Isotope[] = [
  {
    id: "f18",
    name: "F-18 (Fluorine-18)",
    type: "PET",
    halfLifeMinutes: 109.7,
    doseCoefficientMSvPerMBq: 0.019, // ICRP 128 FDG
    commonUsage: "PET Imaging (FDG)",
    protocols: [
      { id: "fdg-oncology", name: "TEP FDG Oncologie", activityMBqPerKg: 3.5, description: "Protocole standard corps entier", pediatric: { baselineMBq: 25.9, minMBq: 26, eanmClass: "B", source: "EANM Dosage Card v5.7 (2016)" } },
      { id: "fdg-brain", name: "TEP FDG Cerveau", activityMBqPerKg: 2.0, description: "Protocole neurologique", pediatric: { baselineMBq: 14, minMBq: 14, eanmClass: "B", source: "EANM Dosage Card v5.7 (2016)" } },
      { id: "f-choline", name: "F-Choline Prostate", activityMBqPerKg: 2.5, description: "Imagerie prostatique" },
      { id: "f-dopa", name: "F-DOPA Parkinson", activityMBqPerKg: 2.0, description: "Troubles du mouvement" },
      { id: "f-psma", name: "F-PSMA Prostate", activityMBqPerKg: 3.0, description: "PET/CT Prostate" },
    ],
    organDoses: [
      { organ: "Vessie", coefficientMGyPerMBq: 0.13 },
      { organ: "Cœur", coefficientMGyPerMBq: 0.022 },
      { organ: "Cerveau", coefficientMGyPerMBq: 0.011 },
      { organ: "Foie", coefficientMGyPerMBq: 0.012 },
      { organ: "Rate", coefficientMGyPerMBq: 0.011 },
    ]
  },
  {
    id: "ga68",
    name: "Ga-68 (Gallium-68)",
    type: "PET",
    halfLifeMinutes: 67.7,
    doseCoefficientMSvPerMBq: 0.022, // literature (PSMA-11 / DOTA-peptides); not in ICRP 128
    commonUsage: "PET Imaging (PSMA/DOTATOC)",
    protocols: [
      { id: "ga-psma", name: "Ga-68 PSMA-11", activityMBqPerKg: 2.0, description: "Bilan cancer prostate", pediatric: { baselineMBq: 12.8, minMBq: 14, eanmClass: "B", source: "EANM card v5.7 — peptides 68Ga" } },
      { id: "ga-dotatoc", name: "Ga-68 DOTATOC/TATE", activityMBqPerKg: 2.0, description: "Tumeurs neuroendocrines", pediatric: { baselineMBq: 12.8, minMBq: 14, eanmClass: "B", source: "EANM card v5.7 — peptides 68Ga" } },
    ],
    organDoses: [
      { organ: "Reins", coefficientMGyPerMBq: 0.091 },
      { organ: "Vessie", coefficientMGyPerMBq: 0.12 },
      { organ: "Foie", coefficientMGyPerMBq: 0.015 },
      { organ: "Rate", coefficientMGyPerMBq: 0.02 },
    ]
  },
  {
    id: "tc99m",
    name: "Tc-99m (Technetium-99m)",
    type: "SPECT",
    halfLifeMinutes: 360.6,
    doseCoefficientMSvPerMBq: 0.009, // fallback only — real value is tracer-specific (see protocols)
    commonUsage: "SPECT Scintigraphy",
    protocols: [
      { id: "bone-scan", name: "Scintigraphie Osseuse", activityMBqPerKg: 7.0, description: "Examen standard (HDP/MDP)", doseCoefficientMSvPerMBq: 0.0049, pediatric: { baselineMBq: 35, minMBq: 40, eanmClass: "B", source: "EANM card v5.7 — Tc-MDP" } },
      { id: "myocardial", name: "Scintigraphie Myocardique (repos)", activityMBqPerKg: 8.0, description: "MIBI/tétrofosmine — repos", doseCoefficientMSvPerMBq: 0.009, pediatric: { baselineMBq: 28, minMBq: 80, eanmClass: "B", source: "EANM card v5.7 — MIBI 1j repos" } },
      { id: "myocardial-stress", name: "Scintigraphie Myocardique (effort)", activityMBqPerKg: 8.0, description: "MIBI/tétrofosmine — effort/stress", doseCoefficientMSvPerMBq: 0.0079, pediatric: { baselineMBq: 84, minMBq: 80, eanmClass: "B", source: "EANM card v5.7 — MIBI 1j effort" } },
      { id: "renal-mag3", name: "Scintigraphie Rénale (MAG3)", activityMBqPerKg: 1.5, description: "Néphrologie — fonction/drainage", doseCoefficientMSvPerMBq: 0.007, pediatric: { baselineMBq: 11.9, minMBq: 15, eanmClass: "A", source: "EANM card v5.7 — Tc-MAG3 (classe A)" } },
      { id: "renal-dmsa", name: "Scintigraphie Rénale (DMSA)", activityMBqPerKg: 1.85, description: "Cortico-rénale (cicatrices)", doseCoefficientMSvPerMBq: 0.0088, pediatric: { baselineMBq: 6.8, minMBq: 18.5, eanmClass: "A", source: "EANM card v5.7 — Tc-DMSA (classe A)" } },
      { id: "thyroid-tc", name: "Scintigraphie Thyroïdienne", activityMBqPerKg: 1.0, description: "Pertechnétate (thyroïde non bloquée)", doseCoefficientMSvPerMBq: 0.013, pediatric: { baselineMBq: 5.6, minMBq: 10, eanmClass: "B", source: "EANM card v5.7 — pertechnétate" } },
      { id: "lung-perf", name: "Perfusion Pulmonaire (MAA)", activityMBqPerKg: 2.0, description: "Embolie pulmonaire — perfusion", doseCoefficientMSvPerMBq: 0.011, pediatric: { baselineMBq: 5.6, minMBq: 10, eanmClass: "B", source: "EANM card v5.7 — Tc-MAA" } },
      { id: "lung-vent", name: "Ventilation Pulmonaire", activityMBqPerKg: 0.4, description: "Aérosol/Technegas (DTPA)", doseCoefficientMSvPerMBq: 0.007, pediatric: { baselineMBq: 5.6, minMBq: 10, eanmClass: "B", source: "EANM card v5.7 — aérosol (à confirmer)" } },
      { id: "sentinel", name: "Ganglion Sentinelle", activityMBqPerKg: 0.5, fixedActivityMBq: 40, description: "Nanocolloïde — repérage péri-tumoral (activité selon protocole)", doseCoefficientMSvPerMBq: 0.0018 },
    ],
    organDoses: [
      { organ: "Côlon", coefficientMGyPerMBq: 0.037 },
      { organ: "Vessie", coefficientMGyPerMBq: 0.024 },
      { organ: "Reins", coefficientMGyPerMBq: 0.007 },
      { organ: "Poumons", coefficientMGyPerMBq: 0.015 },
      { organ: "Foie", coefficientMGyPerMBq: 0.004 },
    ]
  },
  {
    id: "i123",
    name: "I-123 (Iodine-123)",
    type: "SPECT",
    halfLifeMinutes: 793.2,
    doseCoefficientMSvPerMBq: 0.013, // fallback — tracer-specific overrides below
    commonUsage: "SPECT Imaging",
    protocols: [
      // DaTSCAN: adult-only, fixed activity (not weight-based, not on EANM paediatric card).
      // Thyroid is blocked (KI/perchlorate) so the free-iodide thyroid coefficient is not shown.
      { id: "datscan", name: "DaTSCAN (Parkinson)", activityMBqPerKg: 2.5, fixedActivityMBq: 150, description: "Ioflupane — activité fixe adulte 111–185 MBq (blocage thyroïdien)", doseCoefficientMSvPerMBq: 0.025, organDoses: [] },
      { id: "mibg-imaging", name: "MIBG (Neuroblastome)", activityMBqPerKg: 5.0, description: "Imagerie sympathique (blocage thyroïdien requis)", doseCoefficientMSvPerMBq: 0.013, pediatric: { baselineMBq: 28, minMBq: 37, eanmClass: "B", source: "EANM card v5.7 — 123I-mIBG" } },
      { id: "thyroid-i123", name: "Thyroïde I-123", activityMBqPerKg: 0.2, description: "Fixation thyroïdienne (iodure)", doseCoefficientMSvPerMBq: 0.22, pediatric: { baselineMBq: 0.6, minMBq: 3, eanmClass: "C", source: "EANM card v5.7 — iodure (classe C)" } },
    ],
    organDoses: [
      { organ: "Vessie", coefficientMGyPerMBq: 0.04 },
      { organ: "Thyroïde", coefficientMGyPerMBq: 0.21 },
      { organ: "Cerveau", coefficientMGyPerMBq: 0.005 },
    ]
  },
  {
    id: "i131",
    name: "I-131 (Iodine-131)",
    type: "Therapy",
    halfLifeMinutes: 11548.8,
    // Effective dose for I-131 iodide depends on thyroid uptake. App branches:
    // functioning thyroid (~35% uptake) ≈ 22 mSv/MBq; blocked thyroid ≈ 0.24 mSv/MBq.
    doseCoefficientMSvPerMBq: 22,
    commonUsage: "Thyroid Therapy/Imaging",
    protocols: [
      { id: "thyroid-imaging", name: "Imagerie Thyroïdienne", activityMBqPerKg: 0.1, intent: "diagnostic", description: "Diagnostic (faible dose)" },
      { id: "thyroid-therapy", name: "Thérapie Thyroïdienne", activityMBqPerKg: 50.0, fixedActivityMBq: 3700, intent: "therapeutic", description: "Ablation/Traitement — activité fixe/dosimétrique" },
    ],
    organDoses: [
      { organ: "Thyroïde", coefficientMGyPerMBq: 430 }, // ~35% uptake, ICRP 128
      { organ: "Estomac", coefficientMGyPerMBq: 0.46 },
      { organ: "Vessie", coefficientMGyPerMBq: 0.6 },
    ]
  },
  {
    id: "lu177",
    name: "Lu-177 (Lutetium-177)",
    type: "Therapy",
    halfLifeMinutes: 9561.6,
    doseCoefficientMSvPerMBq: 0.13, // literature (ICRP 140 territory); therapy = absorbed-dose driven
    commonUsage: "Theranostics",
    protocols: [
      { id: "psma-therapy", name: "Thérapie PSMA", activityMBqPerKg: 100, fixedActivityMBq: 7400, intent: "therapeutic", description: "Cancer de la prostate — 7,4 GBq/cycle (fixe/dosimétrique)" },
      { id: "dotatate-therapy", name: "Thérapie DOTATATE", activityMBqPerKg: 100, fixedActivityMBq: 7400, intent: "therapeutic", description: "Tumeurs neuroendocrines — 7,4 GBq/cycle (fixe/dosimétrique)" },
    ],
    organDoses: [
      { organ: "Reins", coefficientMGyPerMBq: 0.65 },
      { organ: "Moelle", coefficientMGyPerMBq: 0.03 },
      { organ: "Foie", coefficientMGyPerMBq: 0.05 },
      { organ: "Rate", coefficientMGyPerMBq: 0.04 },
    ]
  },
  {
    id: "tl201",
    name: "Tl-201 (Thallium-201)",
    type: "SPECT",
    halfLifeMinutes: 4377.6,
    doseCoefficientMSvPerMBq: 0.14, // ICRP 128 (legacy catalogs list ~0.23)
    commonUsage: "Myocardial Perfusion",
    protocols: [
      { id: "tl-myocardial", name: "Perfusion Myocardique", activityMBqPerKg: 1.5, description: "Viabilité myocardique" },
    ],
    organDoses: [
      { organ: "Reins", coefficientMGyPerMBq: 1.2 },
      { organ: "Cœur", coefficientMGyPerMBq: 0.17 },
      { organ: "Foie", coefficientMGyPerMBq: 0.12 },
      { organ: "Vessie", coefficientMGyPerMBq: 0.08 },
    ]
  },
  {
    id: "y90",
    name: "Y-90 (Yttrium-90)",
    type: "Therapy",
    halfLifeMinutes: 3843.6, // 64.06 h
    doseCoefficientMSvPerMBq: 0, // pure β⁻ therapy — pilotée par la dose absorbée, pas la dose efficace
    commonUsage: "Radioembolisation (SIRT) / Radiosynoviorthèse",
    protocols: [
      { id: "sirt", name: "Radioembolisation hépatique (SIRT)", activityMBqPerKg: 20, fixedActivityMBq: 1500, intent: "therapeutic", description: "Microsphères — activité individualisée (BSA/partition), 1,5 GBq indicatif" },
    ],
    organDoses: [
      { organ: "Foie", coefficientMGyPerMBq: 0.05 },
      { organ: "Poumons", coefficientMGyPerMBq: 0.006 },
    ]
  },
];

export type EanmClass = 'A' | 'B' | 'C';

/**
 * EANM Paediatric Dosage Card v5.7 (2016) — full three-column multiples table.
 * Administered activity = baseline × multiple(weight, class); the column MUST match
 * the radiopharmaceutical's class (a single column only reproduces the card at 3 kg).
 * Source: Lassmann M et al., Eur J Nucl Med Mol Imaging 2008;35:1748.
 */
export const EANM_MULTIPLIERS: { maxWeight: number; A: number; B: number; C: number }[] = [
  { maxWeight: 3, A: 1, B: 1, C: 1 },
  { maxWeight: 4, A: 1.12, B: 1.14, C: 1.33 },
  { maxWeight: 6, A: 1.47, B: 1.71, C: 2.0 },
  { maxWeight: 8, A: 1.71, B: 2.14, C: 3.0 },
  { maxWeight: 10, A: 1.94, B: 2.71, C: 3.67 },
  { maxWeight: 12, A: 2.18, B: 3.14, C: 4.67 },
  { maxWeight: 14, A: 2.35, B: 3.57, C: 5.67 },
  { maxWeight: 16, A: 2.53, B: 4.0, C: 6.33 },
  { maxWeight: 18, A: 2.71, B: 4.43, C: 7.33 },
  { maxWeight: 20, A: 2.88, B: 4.86, C: 8.33 },
  { maxWeight: 22, A: 3.06, B: 5.29, C: 9.33 },
  { maxWeight: 24, A: 3.18, B: 5.71, C: 10.0 },
  { maxWeight: 26, A: 3.35, B: 6.14, C: 11.0 },
  { maxWeight: 28, A: 3.47, B: 6.43, C: 12.0 },
  { maxWeight: 30, A: 3.65, B: 6.86, C: 13.0 },
  { maxWeight: 32, A: 3.77, B: 7.29, C: 14.0 },
  { maxWeight: 34, A: 3.88, B: 7.72, C: 15.0 },
  { maxWeight: 36, A: 4.0, B: 8.0, C: 16.0 },
  { maxWeight: 38, A: 4.18, B: 8.43, C: 17.0 },
  { maxWeight: 40, A: 4.29, B: 8.86, C: 18.0 },
  { maxWeight: 42, A: 4.41, B: 9.14, C: 19.0 },
  { maxWeight: 44, A: 4.53, B: 9.57, C: 20.0 },
  { maxWeight: 46, A: 4.65, B: 10.0, C: 21.0 },
  { maxWeight: 48, A: 4.77, B: 10.29, C: 22.0 },
  { maxWeight: 50, A: 4.88, B: 10.71, C: 23.0 },
  { maxWeight: 54, A: 5.0, B: 11.29, C: 24.67 },
  { maxWeight: 58, A: 5.24, B: 12.0, C: 26.67 },
  { maxWeight: 62, A: 5.47, B: 12.71, C: 28.67 },
  { maxWeight: 66, A: 5.65, B: 13.43, C: 31.0 },
  { maxWeight: 68, A: 5.77, B: 14.0, C: 32.33 },
];

/** EANM multiple for a weight and radiopharmaceutical class (defaults to class B). */
export const getPediatricMultiplier = (weight: number, eanmClass: EanmClass = 'B'): number => {
  for (const row of EANM_MULTIPLIERS) {
    if (weight <= row.maxWeight) return row[eanmClass];
  }
  return EANM_MULTIPLIERS[EANM_MULTIPLIERS.length - 1][eanmClass];
};
