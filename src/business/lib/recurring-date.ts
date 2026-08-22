import type { RecurringPeriod } from '@/business/lib/validation/transaction';

export function computeNextRecurringDate(
  from: Date,
  period: RecurringPeriod,
): Date {
  const d = new Date(from);
  switch (period) {
    case 'DAILY':
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case 'WEEKLY':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'BIWEEKLY':
      d.setUTCDate(d.getUTCDate() + 14);
      break;
    case 'MONTHLY':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'SEMIANNUAL':
      d.setUTCMonth(d.getUTCMonth() + 6);
      break;
    case 'ANNUAL':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return d;
}
