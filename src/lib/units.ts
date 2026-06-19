/**
 * Unit conversion — single source of truth.
 *
 * The whole application computes in **MBq** internally and only converts to the
 * user-facing unit at the very last moment (display / export). This prevents the
 * class of bug where an MBq value is divided by a mCi concentration (see the
 * volume-to-draw calculation). 1 mCi = 37 MBq exactly.
 */
import { Unit } from '../types';

export const MBQ_PER_MCI = 37;
export const MCI_PER_MBQ = 1 / MBQ_PER_MCI; // 0.027027...

/** Convert a value expressed in `unit` into MBq (the internal canonical unit). */
export const toMBq = (value: number, unit: Unit): number =>
  unit === 'mCi' ? value * MBQ_PER_MCI : value;

/** Convert an MBq value into the requested display `unit`. */
export const fromMBq = (mbq: number, unit: Unit): number =>
  unit === 'mCi' ? mbq * MCI_PER_MBQ : mbq;

/** Format an MBq value for display in the chosen unit (mCi → 2 decimals, MBq → 1). */
export const formatActivity = (mbq: number, unit: Unit, digits?: number): string => {
  const val = fromMBq(mbq, unit);
  if (!Number.isFinite(val)) return (0).toFixed(digits ?? (unit === 'mCi' ? 2 : 1));
  return val.toFixed(digits ?? (unit === 'mCi' ? 2 : 1));
};
