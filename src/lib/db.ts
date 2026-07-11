/**
 * Firestore data access for RadCalc Pro (single center). All collections are top-level;
 * access is controlled by security rules (firestore.rules). Reads use live subscriptions.
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Patient, Exam, Vial, UserProfile, ExamStatus, ExamAdministration, SafetyChecks, CenterConfig } from '../types';
import { Role } from './roles';

/** Remove undefined fields — Firestore rejects them. */
const clean = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

const mapDocs = <T>(snap: QuerySnapshot<DocumentData>): T[] =>
  snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);

type Actor = { uid: string; name: string };

// ── Patients ─────────────────────────────────────────────────────────────────

export const subscribePatients = (cb: (patients: Patient[]) => void, onError?: (e: Error) => void) =>
  onSnapshot(query(collection(db, 'patients'), orderBy('lastName')), (s) => cb(mapDocs<Patient>(s)), onError);

export const createPatient = async (
  data: Omit<Patient, 'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedAt'>,
  actor: Actor,
): Promise<string> => {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'patients'), clean({
    ...data,
    createdBy: actor.uid,
    createdByName: actor.name,
    createdAt: now,
    updatedAt: now,
  }));
  return ref.id;
};

export const subscribePatient = (id: string, cb: (p: Patient | null) => void, onError?: (e: Error) => void) =>
  onSnapshot(doc(db, 'patients', id), (s) => cb(s.exists() ? ({ id: s.id, ...s.data() } as Patient) : null), onError);

export const updatePatient = async (id: string, data: Partial<Patient>, actor: Actor): Promise<void> => {
  await updateDoc(doc(db, 'patients', id), clean({ ...data, updatedBy: actor.uid, updatedByName: actor.name, updatedAt: new Date().toISOString() }));
};

export const deletePatient = (id: string): Promise<void> => deleteDoc(doc(db, 'patients', id));

// ── Exams ────────────────────────────────────────────────────────────────────

export const subscribeExams = (cb: (exams: Exam[]) => void, onError?: (e: Error) => void) =>
  onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), (s) => cb(mapDocs<Exam>(s)), onError);

/** Bounded, patient-scoped exam query (server-side filter, not client slicing). */
export const subscribeExamsByPatient = (patientId: string, cb: (exams: Exam[]) => void, onError?: (e: Error) => void) =>
  onSnapshot(
    query(collection(db, 'exams'), where('patientId', '==', patientId), orderBy('createdAt', 'desc')),
    (s) => cb(mapDocs<Exam>(s)),
    onError,
  );

export const createExam = async (
  data: Omit<Exam, 'id' | 'performedBy' | 'performedByName' | 'createdAt' | 'status'>,
  actor: Actor,
): Promise<string> => {
  const ref = await addDoc(collection(db, 'exams'), clean({
    ...data,
    status: 'draft' as ExamStatus,
    performedBy: actor.uid,
    performedByName: actor.name,
    createdAt: new Date().toISOString(),
  }));
  return ref.id;
};

export const validateExam = (id: string, actor: Actor): Promise<void> =>
  updateDoc(doc(db, 'exams', id), {
    status: 'validated' as ExamStatus,
    validatedBy: actor.uid,
    validatedByName: actor.name,
    validatedAt: new Date().toISOString(),
  });

/** Record the measured post-injection administration on a draft exam (radioprotection trace). */
export const recordAdministration = (
  id: string,
  data: Omit<ExamAdministration, 'recordedBy' | 'recordedByName' | 'recordedAt'>,
  actor: Actor,
): Promise<void> =>
  updateDoc(doc(db, 'exams', id), {
    administration: clean({
      ...data,
      recordedBy: actor.uid,
      recordedByName: actor.name,
      recordedAt: new Date().toISOString(),
    }),
  });

/** Persist the safety checklist on a draft exam (each item attributed & timestamped). */
export const updateSafetyChecks = (id: string, safetyChecks: SafetyChecks): Promise<void> =>
  updateDoc(doc(db, 'exams', id), { safetyChecks });

export const deleteExam = (id: string): Promise<void> => deleteDoc(doc(db, 'exams', id));

// ── Vials (shared inventory) ──────────────────────────────────────────────────

export const subscribeVials = (cb: (vials: Vial[]) => void, onError?: (e: Error) => void) =>
  onSnapshot(query(collection(db, 'vials'), orderBy('createdAt', 'desc')), (s) => cb(mapDocs<Vial>(s)), onError);

export const createVial = async (
  data: Omit<Vial, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>,
  actor: Actor,
): Promise<string> => {
  const ref = await addDoc(collection(db, 'vials'), clean({
    ...data,
    createdBy: actor.uid,
    createdByName: actor.name,
    createdAt: new Date().toISOString(),
  }));
  return ref.id;
};

export const deleteVial = (id: string): Promise<void> => deleteDoc(doc(db, 'vials', id));

// ── Users (admin) ─────────────────────────────────────────────────────────────

export const subscribeUsers = (cb: (users: UserProfile[]) => void, onError?: (e: Error) => void) =>
  onSnapshot(
    query(collection(db, 'users'), orderBy('createdAt')),
    (s) => cb(s.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)),
    onError,
  );

export const setUserRole = (uid: string, role: Role): Promise<void> =>
  updateDoc(doc(db, 'users', uid), { role });

export const setUserActive = (uid: string, active: boolean): Promise<void> =>
  updateDoc(doc(db, 'users', uid), { active });

// ── Center config (DRLs / thresholds — admin editable) ────────────────────────

export const subscribeConfig = (cb: (c: CenterConfig) => void, onError?: (e: Error) => void) =>
  onSnapshot(doc(db, 'config', 'center'), (s) => cb(s.exists() ? (s.data() as CenterConfig) : {}), onError);

export const saveConfig = (patch: Partial<CenterConfig>, actor: Actor): Promise<void> =>
  setDoc(
    doc(db, 'config', 'center'),
    clean({ ...patch, updatedBy: actor.uid, updatedByName: actor.name, updatedAt: new Date().toISOString() }),
    { merge: true },
  );
