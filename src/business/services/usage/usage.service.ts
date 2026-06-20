import { prisma } from '@/database/prisma/prisma';
import { LimitReachedError } from '@/business/lib/errors';

export const AI_LIMITS = {
  transactions: 30,
  insights: 5,
} as const;

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const getOrCreate = (userId: string, month: string) =>
  prisma.aiUsage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month },
    update: {},
  });

const checkTransactionLimit = async (userId: string) => {
  const month = getCurrentMonth();
  const usage = await getOrCreate(userId, month);
  if (usage.transactionCount >= AI_LIMITS.transactions) {
    throw new LimitReachedError('AI transaction limit reached for this month');
  }
};

const incrementTransaction = async (userId: string) => {
  const month = getCurrentMonth();
  await prisma.aiUsage.update({
    where: { userId_month: { userId, month } },
    data: { transactionCount: { increment: 1 } },
  });
};

const checkInsightLimit = async (userId: string) => {
  const month = getCurrentMonth();
  const usage = await getOrCreate(userId, month);
  if (usage.insightCount >= AI_LIMITS.insights) {
    throw new LimitReachedError('AI insight limit reached for this month');
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
  checkInsightLimit,
  incrementInsight,
  getCurrentUsage,
};
