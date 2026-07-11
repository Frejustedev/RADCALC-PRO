import { readFileSync } from 'fs';
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

const now = '2026-01-01T00:00:00.000Z';

const seedUser = (uid: string, role: string, active = true, email = `${uid}@imena.ci`) =>
  env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'users', uid), { email, displayName: uid, role, active, createdAt: now }),
  );

const seedDoc = (path: string[], data: Record<string, unknown>) =>
  env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), path.join('/')), data));

const asUser = (uid: string, email = `${uid}@imena.ci`) => env.authenticatedContext(uid, { email }).firestore();

const baseExam = (performedBy: string) => ({
  patientId: 'p1', patientName: 'X', isotopeId: 'f18', isotopeName: 'F-18', protocolId: 'fdg-oncology',
  protocolName: 'FDG', unit: 'MBq', recommendedActivityMBq: 245, effectiveDoseMSv: 4.66,
  patientSnapshot: { weight: 70, height: 175, age: 45, gender: 'M', isPediatric: false },
  status: 'draft', performedBy, performedByName: performedBy, createdAt: now,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'radcalc-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

describe('users / self-registration', () => {
  it('a user may create their own inactive manipulateur profile', async () => {
    await assertSucceeds(setDoc(doc(asUser('u1'), 'users/u1'), { email: 'u1@imena.ci', displayName: 'U1', role: 'manipulateur', active: false, createdAt: now }));
  });
  it('cannot self-grant admin or active', async () => {
    await assertFails(setDoc(doc(asUser('u1'), 'users/u1'), { email: 'u1@imena.ci', displayName: 'U1', role: 'admin', active: false, createdAt: now }));
    await assertFails(setDoc(doc(asUser('u1'), 'users/u1'), { email: 'u1@imena.ci', displayName: 'U1', role: 'manipulateur', active: true, createdAt: now }));
  });
  it('cannot impersonate another email or another uid', async () => {
    await assertFails(setDoc(doc(asUser('u1'), 'users/u1'), { email: 'someone@else.com', displayName: 'U1', role: 'manipulateur', active: false, createdAt: now }));
    await assertFails(setDoc(doc(asUser('u1'), 'users/u2'), { email: 'u1@imena.ci', displayName: 'U1', role: 'manipulateur', active: false, createdAt: now }));
  });
  it('only admins manage role/activation', async () => {
    await seedUser('med', 'medecin');
    await seedUser('adm', 'admin');
    await seedUser('target', 'manipulateur', false);
    await assertFails(updateDoc(doc(asUser('med'), 'users/target'), { active: true }));
    await assertSucceeds(updateDoc(doc(asUser('adm'), 'users/target'), { active: true, role: 'manipulateur', email: 'target@imena.ci', displayName: 'target', createdAt: now }));
  });
});

describe('patients', () => {
  it('creator is bound; provenance frozen and updatedBy required on edit', async () => {
    await seedUser('mani', 'manipulateur');
    const d = asUser('mani');
    await assertFails(addDoc(collection(d, 'patients'), { firstName: 'A', lastName: 'B', gender: 'M', weight: 70, height: 175, age: 40, createdBy: 'someoneElse', createdAt: now, updatedAt: now }));
    await seedDoc(['patients', 'pat1'], { firstName: 'A', lastName: 'B', gender: 'M', weight: 70, height: 175, age: 40, createdBy: 'mani', createdByName: 'mani', createdAt: now, updatedAt: now });
    // must pin updatedBy to caller and keep provenance
    await assertFails(updateDoc(doc(d, 'patients/pat1'), { weight: 71, createdBy: 'x', updatedAt: now }));
    await assertFails(updateDoc(doc(d, 'patients/pat1'), { weight: 71, updatedAt: now })); // no updatedBy
    await assertSucceeds(updateDoc(doc(d, 'patients/pat1'), { weight: 71, updatedBy: 'mani', updatedAt: now }));
  });
  it('a read-only lecteur cannot write patients', async () => {
    await seedUser('lec', 'lecteur');
    await assertFails(addDoc(collection(asUser('lec'), 'patients'), { firstName: 'A', lastName: 'B', gender: 'M', weight: 70, height: 175, age: 40, createdBy: 'lec', createdAt: now, updatedAt: now }));
  });
});

describe('exams — integrity of the medical record', () => {
  it('performer bound; new exams start as draft', async () => {
    await seedUser('mani', 'manipulateur');
    await assertFails(addDoc(collection(asUser('mani'), 'exams'), { ...baseExam('mani'), status: 'validated' }));
    await assertSucceeds(addDoc(collection(asUser('mani'), 'exams'), baseExam('mani')));
  });
  it('validation is one-way, validator pinned, dosimetry frozen', async () => {
    await seedUser('med', 'medecin');
    await seedDoc(['exams', 'e1'], baseExam('mani'));
    const d = asUser('med');
    // cannot also change dosimetry while validating (hasOnly)
    await assertFails(updateDoc(doc(d, 'exams/e1'), { status: 'validated', validatedBy: 'med', validatedByName: 'med', validatedAt: now, recommendedActivityMBq: 999 }));
    // validator must be the caller
    await assertFails(updateDoc(doc(d, 'exams/e1'), { status: 'validated', validatedBy: 'someoneElse', validatedByName: 'x', validatedAt: now }));
    await assertSucceeds(updateDoc(doc(d, 'exams/e1'), { status: 'validated', validatedBy: 'med', validatedByName: 'med', validatedAt: now }));
  });
  it('a validated exam can no longer be mutated', async () => {
    await seedUser('med', 'medecin');
    await seedDoc(['exams', 'e1'], { ...baseExam('mani'), status: 'validated', validatedBy: 'med' });
    await assertFails(updateDoc(doc(asUser('med'), 'exams/e1'), { recommendedActivityMBq: 1 }));
    await assertFails(updateDoc(doc(asUser('med'), 'exams/e1'), { safetyChecks: { identity: { checked: true } } }));
  });
  it('draft edits allow administration/safetyChecks but freeze dosimetry & performer', async () => {
    await seedUser('mani', 'manipulateur');
    await seedDoc(['exams', 'e1'], baseExam('mani'));
    const d = asUser('mani');
    await assertSucceeds(updateDoc(doc(d, 'exams/e1'), { safetyChecks: { identity: { checked: true, checkedBy: 'mani' } } }));
    await assertSucceeds(updateDoc(doc(d, 'exams/e1'), { administration: { administeredActivityMBq: 240, actualInjectionTime: now, recordedBy: 'mani', recordedByName: 'mani', recordedAt: now } }));
    await assertFails(updateDoc(doc(d, 'exams/e1'), { recommendedActivityMBq: 1 })); // dosimetry frozen
    await assertFails(updateDoc(doc(d, 'exams/e1'), { safetyChecks: {}, performedBy: 'other' })); // performer frozen
  });
  it('only admins hard-delete an exam', async () => {
    await seedUser('med', 'medecin');
    await seedUser('adm', 'admin');
    await seedDoc(['exams', 'e1'], baseExam('mani'));
    await assertFails((async () => { const { deleteDoc } = await import('firebase/firestore'); return deleteDoc(doc(asUser('med'), 'exams/e1')); })());
    await assertSucceeds((async () => { const { deleteDoc } = await import('firebase/firestore'); return deleteDoc(doc(asUser('adm'), 'exams/e1')); })());
  });
});

describe('vials & config & default-deny', () => {
  it('vial writes restricted to admin/radiopharmacien', async () => {
    await seedUser('mani', 'manipulateur');
    await seedUser('rp', 'radiopharmacien');
    await assertFails(addDoc(collection(asUser('mani'), 'vials'), { isotopeId: 'f18', initialActivity: 3700, initialVolume: 10, referenceTime: now, createdBy: 'mani', createdAt: now }));
    await assertSucceeds(addDoc(collection(asUser('rp'), 'vials'), { isotopeId: 'f18', initialActivity: 3700, initialVolume: 10, referenceTime: now, createdBy: 'rp', createdAt: now }));
  });
  it('config: active users read, only admin writes', async () => {
    await seedUser('lec', 'lecteur');
    await seedUser('adm', 'admin');
    await seedDoc(['config', 'center'], { diagnosticDoseAlertMSv: 15 });
    await assertSucceeds(getDoc(doc(asUser('lec'), 'config/center')));
    await assertFails(setDoc(doc(asUser('lec'), 'config/center'), { diagnosticDoseAlertMSv: 1 }, { merge: true }));
    await assertSucceeds(setDoc(doc(asUser('adm'), 'config/center'), { diagnosticDoseAlertMSv: 20 }, { merge: true }));
  });
  it('everything else is denied by default', async () => {
    await seedUser('adm', 'admin');
    await assertFails(setDoc(doc(asUser('adm'), 'random/x'), { a: 1 }));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'patients/p1')));
  });
});
