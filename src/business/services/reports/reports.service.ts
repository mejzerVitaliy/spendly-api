import {
  AiInsightsData,
  CategoryChart,
  CashFlowTrendChart,
  NotFoundError,
  ReportsSummary,
} from '@/business/lib';
import {
  dailySnapshotRepository,
  userRepository,
  transactionRepository,
} from '@/database/repositories';
import { TransactionType } from '@prisma/client';
import { currencyService } from '../currency/currency.service';
import { generateFinancialInsights } from '@/bootstrap/openai';

const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}`;
};

const getSummary = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<ReportsSummary> => {
  const user = await userRepository.findUnique({ where: { id: userId } });
  if (!user) throw NotFoundError('User not found');

  const isAllTime = !startDate && !endDate;

  // Balance is still read from snapshots — transfers are net-zero so snapshot
  // closing balances are always correct.
  let totalBalance = user.totalBalance;
  if (!isAllTime) {
    const snapshots = await dailySnapshotRepository.findMany({
      where: {
        userId,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      orderBy: { date: 'asc' },
    });

    if (snapshots.length > 0) {
      totalBalance = snapshots[snapshots.length - 1].closingBalance;
    } else {
      const before = await dailySnapshotRepository.findFirst({
        where: {
          userId,
          date: { lt: startDate ? new Date(startDate) : undefined },
        },
        orderBy: { date: 'desc' },
      });
      totalBalance = before?.closingBalance ?? 0;
    }
  } else {
    const latest = await dailySnapshotRepository.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    if (latest) totalBalance = latest.closingBalance;
  }

  // Income / expense are computed directly from transactions, excluding transfers.
  const transactions = await transactionRepository.findMany({
    where: {
      userId,
      transferGroupId: null,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const tx of transactions) {
    const converted = await currencyService.convertAmount(
      tx.amount,
      tx.currencyCode,
      user.mainCurrencyCode,
    );
    if (tx.type === TransactionType.INCOME) {
      totalIncome += converted;
      incomeCount++;
    } else {
      totalExpense += converted;
      expenseCount++;
    }
  }

  return {
    totalBalance,
    currencyCode: user.mainCurrencyCode,
    totalIncome,
    totalExpense,
    netChange: totalIncome - totalExpense,
    incomeCount,
    expenseCount,
    totalTransactions: incomeCount + expenseCount,
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
      isAllTime,
    },
  };
};

const getCategoryChart = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  type?: TransactionType,
  language?: string,
): Promise<CategoryChart> => {
  const user = await userRepository.findUnique({ where: { id: userId } });
  if (!user) throw NotFoundError('User not found');

  const transactions = await transactionRepository.findMany({
    where: {
      userId,
      type: type || TransactionType.EXPENSE,
      transferGroupId: null,
      categoryId: { not: null },
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: { category: true },
  });

  const categoryMap = new Map<string, { value: number; color: string }>();
  let total = 0;

  for (const transaction of transactions) {
    const cat = transaction.category;
    if (!cat) continue;

    const convertedAmount = await currencyService.convertAmount(
      transaction.amount,
      transaction.currencyCode,
      user.mainCurrencyCode,
    );
    const label = language === 'ru' && cat.nameRu ? cat.nameRu : cat.name;
    const color = cat.color;
    const existing = categoryMap.get(label) || { value: 0, color };
    categoryMap.set(label, {
      value: existing.value + convertedAmount,
      color,
    });
    total += convertedAmount;
  }

  const data = Array.from(categoryMap.entries())
    .map(([label, { value, color }]) => ({
      label,
      value,
      color,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  return {
    data,
    total,
    currencyCode: user.mainCurrencyCode,
    period: { from: startDate || null, to: endDate || null },
  };
};

const getCashFlowTrend = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<CashFlowTrendChart> => {
  const user = await userRepository.findUnique({ where: { id: userId } });
  if (!user) throw NotFoundError('User not found');
  if (!startDate || !endDate)
    throw NotFoundError('startDate and endDate are required');

  // Query transactions directly, excluding transfers.
  const transactions = await transactionRepository.findMany({
    where: {
      userId,
      transferGroupId: null,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
  });

  const incomeByDate = new Map<string, number>();
  const expenseByDate = new Map<string, number>();

  for (const tx of transactions) {
    const dateStr = tx.date.toISOString().split('T')[0];
    const converted = await currencyService.convertAmount(
      tx.amount,
      tx.currencyCode,
      user.mainCurrencyCode,
    );
    if (tx.type === TransactionType.INCOME) {
      incomeByDate.set(dateStr, (incomeByDate.get(dateStr) ?? 0) + converted);
    } else {
      expenseByDate.set(dateStr, (expenseByDate.get(dateStr) ?? 0) + converted);
    }
  }

  const incomes: CashFlowTrendChart['incomes'] = [];
  const expenses: CashFlowTrendChart['expenses'] = [];

  for (
    let date = new Date(startDate);
    date <= new Date(endDate);
    date.setDate(date.getDate() + 1)
  ) {
    const dateStr = date.toISOString().split('T')[0];
    const label = formatDateLabel(dateStr);
    incomes.push({
      date: dateStr,
      label,
      value: incomeByDate.get(dateStr) ?? 0,
    });
    expenses.push({
      date: dateStr,
      label,
      value: expenseByDate.get(dateStr) ?? 0,
    });
  }

  return {
    incomes,
    expenses,
    currencyCode: user.mainCurrencyCode,
    period: { from: startDate, to: endDate },
  };
};

const getAiInsights = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  language?: string,
): Promise<AiInsightsData> => {
  const [summary, expenseCategories, incomeCategories] = await Promise.all([
    getSummary(userId, startDate, endDate),
    getCategoryChart(
      userId,
      startDate,
      endDate,
      TransactionType.EXPENSE,
      language,
    ),
    getCategoryChart(
      userId,
      startDate,
      endDate,
      TransactionType.INCOME,
      language,
    ),
  ]);

  const periodStr =
    startDate && endDate ? `${startDate} — ${endDate}` : 'all time';

  const insights = await generateFinancialInsights(
    {
      period: periodStr,
      currencyCode: summary.currencyCode,
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      netChange: summary.netChange,
      totalTransactions: summary.totalTransactions,
      incomeCount: summary.incomeCount,
      expenseCount: summary.expenseCount,
      topExpenses: expenseCategories.data.slice(0, 5),
      topIncomes: incomeCategories.data.slice(0, 3),
    },
    language ?? 'en',
  );

  return {
    insights,
    generatedAt: new Date().toISOString(),
  };
};

export const reportsService = {
  getSummary,
  getCategoryChart,
  getCashFlowTrend,
  getAiInsights,
};
