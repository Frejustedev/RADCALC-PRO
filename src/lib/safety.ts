import { SafetyChecks } from '../types';

/** Radioprotection / identitovigilance checklist. `required` items gate exam validation. */
export const SAFETY_ITEMS: { key: string; label: string; required: boolean }[] = [
  { key: 'identity', label: "Identité patient vérifiée (nom, date de naissance)", required: true },
  { key: 'pregnancy', label: 'Grossesse exclue ou bénéfice/risque évalué', required: true },
  { key: 'consent', label: 'Information et consentement recueillis', required: true },
  { key: 'protocol', label: 'Indication et protocole conformes', required: true },
  { key: 'fasting', label: 'Préparation (jeûne, hydratation, blocage) conforme', required: false },
  { key: 'renal', label: 'Fonction rénale compatible', required: false },
];

/** All required checks are ticked. */
export const areRequiredChecksDone = (checks?: SafetyChecks): boolean =>
  SAFETY_ITEMS.filter((i) => i.required).every((i) => checks?.[i.key]?.checked === true);

export const countChecksDone = (checks?: SafetyChecks): number =>
  SAFETY_ITEMS.filter((i) => checks?.[i.key]?.checked === true).length;
