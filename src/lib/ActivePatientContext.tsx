import React, { createContext, useContext, useState } from 'react';
import { Patient } from '../types';

interface ActivePatientState {
  patient: Patient | null;
  setPatient: (p: Patient | null) => void;
}

const Ctx = createContext<ActivePatientState | undefined>(undefined);

export const ActivePatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  return <Ctx.Provider value={{ patient, setPatient }}>{children}</Ctx.Provider>;
};

export const useActivePatient = (): ActivePatientState => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useActivePatient must be used within ActivePatientProvider');
  return ctx;
};
