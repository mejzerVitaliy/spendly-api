import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';

vi.mock('@/config', () => ({ environmentVariables: {} }));
vi.mock('@/database/repositories', () => ({
  transactionRepository: { findMany: vi.fn() },
  userRepository: {},
  pushTokenRepository: {},
  notificationCooldownRepository: {},
}));

import { notificationDispatchService } from './notification-dispatch.service';
import { transactionRepository } from '@/database/repositories';

const findMany = transactionRepository.findMany as Mock;

// Fixed "today" so streak/inactivity math is deterministic: Wednesday.
const TODAY = new Date('2026-09-16T12:00:00.000Z');

const txOnDate = (isoDate: string) => ({
  date: new Date(`${isoDate}T09:00:00.000Z`),
});

describe('notificationDispatchService.getStreakAndLastTxDate', () => {
  beforeEach(() => {
    findMany.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a zero streak and null date with no transactions', async () => {
    findMany.mockResolvedValue([]);
    const result =
      await notificationDispatchService.getStreakAndLastTxDate('user-1');
    expect(result).toEqual({ lastTransactionDate: null, currentStreak: 0 });
  });

  it('counts a streak of consecutive days ending today', async () => {
    findMany.mockResolvedValue([
      txOnDate('2026-09-16'),
      txOnDate('2026-09-15'),
      txOnDate('2026-09-14'),
    ]);
    const result =
      await notificationDispatchService.getStreakAndLastTxDate('user-1');
    expect(result.currentStreak).toBe(3);
    expect(result.lastTransactionDate).toBe('2026-09-16');
  });

  it('still counts the streak as active if the last transaction was yesterday', async () => {
    findMany.mockResolvedValue([
      txOnDate('2026-09-15'),
      txOnDate('2026-09-14'),
    ]);
    const result =
      await notificationDispatchService.getStreakAndLastTxDate('user-1');
    expect(result.currentStreak).toBe(2);
  });

  it('resets to zero once there is a gap before yesterday', async () => {
    findMany.mockResolvedValue([
      txOnDate('2026-09-10'),
      txOnDate('2026-09-09'),
    ]);
    const result =
      await notificationDispatchService.getStreakAndLastTxDate('user-1');
    expect(result.currentStreak).toBe(0);
    // lastTransactionDate is still reported even when the streak is broken -
    // dispatchForUser uses it separately to compute daysSinceTx for the
    // inactivity nudge.
    expect(result.lastTransactionDate).toBe('2026-09-10');
  });

  it('breaks the streak count at the first gap, ignoring older consecutive runs', async () => {
    findMany.mockResolvedValue([
      txOnDate('2026-09-16'),
      txOnDate('2026-09-15'),
      // gap - 09-14 missing
      txOnDate('2026-09-13'),
      txOnDate('2026-09-12'),
    ]);
    const result =
      await notificationDispatchService.getStreakAndLastTxDate('user-1');
    expect(result.currentStreak).toBe(2);
  });

  it('collapses multiple same-day transactions into a single streak day', async () => {
    findMany.mockResolvedValue([
      txOnDate('2026-09-16'),
      { date: new Date('2026-09-16T23:00:00.000Z') },
      txOnDate('2026-09-15'),
    ]);
    const result =
      await notificationDispatchService.getStreakAndLastTxDate('user-1');
    expect(result.currentStreak).toBe(2);
  });
});
