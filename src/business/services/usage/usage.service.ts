import { prisma } from '@/database/prisma/prisma';
import { LimitReachedError } from '@/business/lib/errors';
import { analyticsService } from '@/business/services/analytics/analytics.service';

export const AI_LIMITS = {
  transactions: 30,
  insights: 5,
} as const;

// Fraction of the monthly quota at which we consider a user "approaching"
// the limit - fired as its own event so the approach can be read as a trend
// (how many people get close), not just the binary hit-the-wall moment.
const APPROACHING_THRESHOLD = 0.8;

// Founder/partner accounts exempted from the monthly AI quota - requested
// directly for these two people, not a general feature flag. Lower-cased
// since email comparisons elsewhere in this app are case-insensitive.
const UNLIMITED_AI_EMAILS = new Set([
  'mejzervitalik@gmail.com',
  'arinaj120@gmail.com',
]);

const isUnlimited = (email?: string) =>
  !!email && UNLIMITED_AI_EMAILS.has(email.toLowerCase());

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const getOrCreate = (userId: string, month: string) =>
  prisma.aiUsage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month },
    update: {},
  });

const checkTransactionLimit = async (
  userId: string,
  email?: string,
  platform?: string,
) => {
  if (isUnlimited(email)) return;

  const month = getCurrentMonth();
  const usage = await getOrCreate(userId, month);
  if (usage.transactionCount >= AI_LIMITS.transactions) {
    analyticsService.track('ai_limit_reached', userId, {
      limitType: 'transactions',
      platform,
    });
    throw new LimitReachedError('AI transaction limit reached for this month');
  }
  if (
    usage.transactionCount >=
    AI_LIMITS.transactions * APPROACHING_THRESHOLD
  ) {
    analyticsService.track('ai_limit_approaching', userId, {
      limitType: 'transactions',
      platform,
    });
  }
};

const incrementTransaction = async (userId: string) => {
  const month = getCurrentMonth();
  await prisma.aiUsage.update({
    where: { userId_month: { userId, month } },
    data: { transactionCount: { increment: 1 } },
  });
};

/**
 * Fire-and-forget counter bump for the AI paths. The user is sitting on a
 * spinner while we respond, and the counter does not gate this request - it
 * was already checked before the model call - so making the response wait on
 * another DB round-trip buys nothing. A lost increment costs at most one extra
 * free parse; a slower parse costs every user every time.
 */
const incrementTransactionInBackground = (userId: string) => {
  void incrementTransaction(userId).catch((err) => {
    console.error(
      '[usage] failed to increment AI transaction count',
      { userId },
      err,
    );
  });
};

const checkInsightLimit = async (
  userId: string,
  email?: string,
  platform?: string,
) => {
  if (isUnlimited(email)) return;

  const month = getCurrentMonth();
  const usage = await getOrCreate(userId, month);
  if (usage.insightCount >= AI_LIMITS.insights) {
    analyticsService.track('ai_limit_reached', userId, {
      limitType: 'insights',
      platform,
    });
    throw new LimitReachedError('AI insight limit reached for this month');
  }
  if (usage.insightCount >= AI_LIMITS.insights * APPROACHING_THRESHOLD) {
    analyticsService.track('ai_limit_approaching', userId, {
      limitType: 'insights',
      platform,
    });
  }
};

const incrementInsight = async (userId: string) => {
  const month = getCurrentMonth();
  await prisma.aiUsage.update({
    where: { userId_month: { userId, month } },
    data: { insightCount: { increment: 1 } },
  });
};

const getCurrentUsage = async (userId: string) => {
  const month = getCurrentMonth();
  const usage = await getOrCreate(userId, month);

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    month,
    resetsAt: nextMonth.toISOString(),
    transactions: {
      used: usage.transactionCount,
      limit: AI_LIMITS.transactions,
    },
    insights: {
      used: usage.insightCount,
      limit: AI_LIMITS.insights,
    },
  };
};

export const usageService = {
  checkTransactionLimit,
  incrementTransaction,
  incrementTransactionInBackground,
  checkInsightLimit,
  incrementInsight,
  getCurrentUsage,
};
