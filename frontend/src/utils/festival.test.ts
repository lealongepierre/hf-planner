import { describe, it, expect } from 'vitest';
import { getDaysUntilFestival, formatCountdown } from './festival';

describe('getDaysUntilFestival', () => {
  it('returns positive number before festival', () => {
    expect(getDaysUntilFestival(new Date('2026-06-17'))).toBe(1);
  });

  it('returns 0 on festival day', () => {
    expect(getDaysUntilFestival(new Date('2026-06-18'))).toBe(0);
  });

  it('returns negative number after festival', () => {
    expect(getDaysUntilFestival(new Date('2026-06-26'))).toBe(-8);
  });
});

describe('formatCountdown', () => {
  it('formats J- before festival', () => {
    expect(formatCountdown(10)).toBe('J-10');
  });

  it('formats J-0 on festival day', () => {
    expect(formatCountdown(0)).toBe('J-0');
  });

  it('formats J+ after festival', () => {
    expect(formatCountdown(-8)).toBe('J+8');
  });
});
