import { describe, it, expect } from 'vitest';
import { can, ROLES, ROLE_LABELS, Role } from './roles';

describe('RBAC permission matrix', () => {
  it('every role has a label', () => {
    ROLES.forEach((r) => expect(ROLE_LABELS[r]).toBeTruthy());
  });

  it('only admin manages users', () => {
    expect(can('admin', 'users:manage')).toBe(true);
    (['medecin', 'radiopharmacien', 'manipulateur', 'lecteur'] as Role[]).forEach((r) =>
      expect(can(r, 'users:manage')).toBe(false),
    );
  });

  it('only admin & radiopharmacien manage the vial inventory', () => {
    expect(can('admin', 'vials:write')).toBe(true);
    expect(can('radiopharmacien', 'vials:write')).toBe(true);
    expect(can('medecin', 'vials:write')).toBe(false);
    expect(can('manipulateur', 'vials:write')).toBe(false);
  });

  it('exam validation is restricted to medecin/radiopharmacien/admin', () => {
    expect(can('medecin', 'exams:validate')).toBe(true);
    expect(can('radiopharmacien', 'exams:validate')).toBe(true);
    expect(can('admin', 'exams:validate')).toBe(true);
    expect(can('manipulateur', 'exams:validate')).toBe(false);
    expect(can('lecteur', 'exams:validate')).toBe(false);
  });

  it('manipulateur can create patients & exams but not validate', () => {
    expect(can('manipulateur', 'patients:write')).toBe(true);
    expect(can('manipulateur', 'exams:create')).toBe(true);
    expect(can('manipulateur', 'exams:validate')).toBe(false);
  });

  it('lecteur is read-only', () => {
    expect(can('lecteur', 'patients:read')).toBe(true);
    expect(can('lecteur', 'exams:read')).toBe(true);
    expect(can('lecteur', 'vials:read')).toBe(true);
    expect(can('lecteur', 'patients:write')).toBe(false);
    expect(can('lecteur', 'exams:create')).toBe(false);
  });

  it('null/undefined role has no permissions', () => {
    expect(can(null, 'patients:read')).toBe(false);
    expect(can(undefined, 'exams:read')).toBe(false);
  });
});
