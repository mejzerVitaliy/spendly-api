import { describe, it, expect } from 'vitest';
import { computeNextRecurringDate } from './recurring-date';

describe('computeNextRecurringDate', () => {
  it('advances by one day for DAILY', () => {
    const next = computeNextRecurringDate(
      new Date('2026-01-15T00:00:00.000Z'),
      'DAILY',
    );
    expect(next.toISOString()).toBe('2026-01-16T00:00:00.000Z');
  });

  it('advances by 7 days for WEEKLY', () => {
    const next = computeNextRecurringDate(
      new Date('2026-01-15T00:00:00.000Z'),
      'WEEKLY',
    );
    expect(next.toISOString()).toBe('2026-01-22T00:00:00.000Z');
  });

  it('advances by 14 days for BIWEEKLY', () => {
    const next = computeNextRecurringDate(
      new Date('2026-01-01T00:00:00.000Z'),
      'BIWEEKLY',
    );
    expect(next.toISOString()).toBe('2026-01-15T00:00:00.000Z');
  });

  it('advances by one calendar month for MONTHLY, rolling over the year boundary', () => {
    const next = computeNextRecurringDate(
      new Date('2026-12-15T00:00:00.000Z'),
      'MONTHLY',
    );
    expect(next.toISOString()).toBe('2027-01-15T00:00:00.000Z');
  });

  it('advances by 6 months for SEMIANNUAL', () => {
    const next = computeNextRecurringDate(
      new Date('2026-01-31T00:00:00.000Z'),
      'SEMIANNUAL',
    );
    expect(next.toISOString()).toBe('2026-07-31T00:00:00.000Z');
  });

  it('advances by one year for ANNUAL', () => {
    const next = computeNextRecurringDate(
      new Date('2026-01-15T00:00:00.000Z'),
      'ANNUAL',
    );
    expect(next.toISOString()).toBe('2027-01-15T00:00:00.000Z');
  });

  it('rolls a Feb 29 source date to Mar 1 when the target year is not a leap year (documents current behavior)', () => {
    const next = computeNextRecurringDate(
      new Date('2028-02-29T00:00:00.000Z'),
      'ANNUAL',
    );
    expect(next.toISOString()).toBe('2029-03-01T00:00:00.000Z');
  });

  it('does not mutate the input date', () => {
    const original = new Date('2026-01-15T00:00:00.000Z');
    const originalTime = original.getTime();
    computeNextRecurringDate(original, 'DAILY');
    expect(original.getTime()).toBe(originalTime);
  });
});
