import { describe, it, expect } from 'vitest';
import { toMBq, fromMBq, formatActivity, MBQ_PER_MCI } from './units';

describe('unit conversion', () => {
  it('1 mCi = 37 MBq', () => {
    expect(MBQ_PER_MCI).toBe(37);
    expect(toMBq(1, 'mCi')).toBe(37);
    expect(toMBq(10, 'mCi')).toBe(370);
  });

  it('MBq passes through unchanged', () => {
    expect(toMBq(3700, 'MBq')).toBe(3700);
    expect(fromMBq(3700, 'MBq')).toBe(3700);
  });

  it('fromMBq converts to mCi', () => {
    expect(fromMBq(37, 'mCi')).toBeCloseTo(1, 6);
    expect(fromMBq(370, 'mCi')).toBeCloseTo(10, 6);
  });

  it('round-trips losslessly', () => {
    for (const v of [1, 37, 100, 3700]) {
      expect(toMBq(fromMBq(v, 'mCi'), 'mCi')).toBeCloseTo(v, 6);
    }
  });

  it('formats with unit-appropriate precision', () => {
    expect(formatActivity(370, 'MBq')).toBe('370.0');
    expect(formatActivity(370, 'mCi')).toBe('10.00');
  });

  it('never returns NaN', () => {
    expect(formatActivity(Number.NaN, 'MBq')).toBe('0.0');
    expect(formatActivity(Number.POSITIVE_INFINITY, 'mCi')).toBe('0.00');
  });
});
