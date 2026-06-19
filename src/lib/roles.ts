/**
 * Role-based access control for the IMeNA (Côte d'Ivoire) nuclear-medicine center.
 *
 * Roles map to real responsibilities in a nuclear-medicine department. Permissions are
 * enforced both in the UI (for ergonomics) AND in Firestore security rules (for safety).
 */
export type Role = 'admin' | 'medecin' | 'radiopharmacien' | 'manipulateur' | 'lecteur';

export const ROLES: Role[] = ['admin', 'medecin', 'radiopharmacien', 'manipulateur', 'lecteur'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  medecin: 'Médecin nucléaire',
  radiopharmacien: 'Radiopharmacien',
  manipulateur: 'Manipulateur (TMN)',
  lecteur: 'Lecteur (consultation)',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Gestion des comptes et de la configuration du centre, accès complet.",
  medecin: "Justification et validation médicale des examens, accès clinique complet.",
  radiopharmacien: "Préparation, gestion des flacons et validation des activités.",
  manipulateur: "Saisie des patients, réalisation des calculs et des examens.",
  lecteur: "Consultation en lecture seule (audit, statistiques).",
};

export type Permission =
  | 'patients:read'
  | 'patients:write'
  | 'exams:read'
  | 'exams:create'
  | 'exams:validate'
  | 'vials:read'
  | 'vials:write'
  | 'users:manage';

const MATRIX: Record<Role, Permission[]> = {
  admin: ['patients:read', 'patients:write', 'exams:read', 'exams:create', 'exams:validate', 'vials:read', 'vials:write', 'users:manage'],
  medecin: ['patients:read', 'patients:write', 'exams:read', 'exams:create', 'exams:validate', 'vials:read'],
  radiopharmacien: ['patients:read', 'patients:write', 'exams:read', 'exams:create', 'exams:validate', 'vials:read', 'vials:write'],
  manipulateur: ['patients:read', 'patients:write', 'exams:read', 'exams:create', 'vials:read'],
  lecteur: ['patients:read', 'exams:read', 'vials:read'],
};

export const can = (role: Role | undefined | null, permission: Permission): boolean =>
  !!role && MATRIX[role]?.includes(permission);

export const ROLE_BADGE_TONE: Record<Role, 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate'> = {
  admin: 'rose',
  medecin: 'emerald',
  radiopharmacien: 'indigo',
  manipulateur: 'amber',
  lecteur: 'slate',
};
