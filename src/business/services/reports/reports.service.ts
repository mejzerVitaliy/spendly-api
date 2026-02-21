import {
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
  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const isAllTime = !startDate && !endDate;

  if (isAllTime) {
    const latestSnapshot = await dailySnapshotRepository.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (!latestSnapshot) {
      return {
        totalBalance: user.totalBalance,
        currencyCode: user.mainCurrencyCode,
        totalIncome: 0,
        totalExpense: 0,
        netChange: 0,
        incomeCount: 0,
        expenseCount: 0,
        totalTransactions: 0,
        period: {
          startDate: null,
          endDate: null,
          isAllTime: true,
        },
      };
    }

    const allSnapshots = await dailySnapshotRepository.findMany({
      where: { userId },
    });

    const totalIncome = allSnapshots.reduce((sum, s) => sum + s.totalIncome, 0);
    const totalExpense = allSnapshots.reduce(
      (sum, s) => sum + s.totalExpense,
      0,
    );
    const incomeCount = allSnapshots.reduce((sum, s) => sum + s.incomeCount, 0);
    const expenseCount = allSnapshots.reduce(
      (sum, s) => sum + s.expenseCount,
      0,
    );

    return {
      totalBalance: latestSnapshot.closingBalance,
      currencyCode: user.mainCurrencyCode,
      totalIncome,
      totalExpense,
      netChange: totalIncome - totalExpense,
      incomeCount,
      expenseCount,
      totalTransactions: incomeCount + expenseCount,
      period: {
        startDate: null,
        endDate: null,
        isAllTime: true,
      },
    };
  }

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

  const totalIncome = snapshots.reduce((sum, s) => sum + s.totalIncome, 0);
  const totalExpense = snapshots.reduce((sum, s) => sum + s.totalExpense, 0);
  const incomeCount = snapshots.reduce((sum, s) => sum + s.incomeCount, 0);
  const expenseCount = snapshots.reduce((sum, s) => sum + s.expenseCount, 0);

  let totalBalance = 0;

  if (snapshots.length > 0) {
    totalBalance = snapshots[snapshots.length - 1].closingBalance;
  } else {
    const snapshotBeforePeriod = await dailySnapshotRepository.findFirst({
      where: {
        userId,
        date: {
          lt: startDate ? new Date(startDate) : undefined,
        },
      },
      orderBy: { date: 'desc' },
    });

    if (snapshotBeforePeriod) {
      totalBalance = snapshotBeforePeriod.closingBalance;
    } else {
      totalBalance = 0;
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
      isAllTime: false,
    },
  };
};

const getCategoryChart = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  type?: TransactionType,
): Promise<CategoryChart> => {
  const user = await userRepository.findUnique({ where: { id: userId } });
  if (!user) throw NotFoundError('User not found');

  const transactions = await transactionRepository.findMany({
    where: {
      userId,
      type: type || TransactionType.EXPENSE,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: { category: true },
  });

  const categoryMap = new Map<string, { amount: number; color: string }>();
  let total = 0;

  for (const transaction of transactions) {
    const convertedAmount = await currencyService.convertAmount(
      transaction.amount,
      transaction.currencyCode,
      user.mainCurrencyCode,
    );
    const label = transaction.category?.name || 'Unknown';
    const color = transaction.category?.color || '#6B7280';
    const existing = categoryMap.get(label) || { amount: 0, color };
    categoryMap.set(label, {
      amount: existing.amount + convertedAmount,
      color,
    });
    total += convertedAmount;
  }

  const data = Array.from(categoryMap.entries())
    .map(([label, { amount, color }]) => ({
      label,
      amount,
      color,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
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

  const snapshots = await dailySnapshotRepository.findMany({
    where: {
      userId,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    orderBy: { date: 'asc' },
  });

  const snapshotMap = new Map(
    snapshots.map((s) => [s.date.toISOString().split('T')[0], s]),
  );

  const incomes: CashFlowTrendChart['incomes'] = [];
  const expenses: CashFlowTrendChart['expenses'] = [];

  for (
    let date = new Date(startDate);
    date <= new Date(endDate);
    date.setDate(date.getDate() + 1)
  ) {
    const dateStr = date.toISOString().split('T')[0];
    const snapshot = snapshotMap.get(dateStr);
    const point = {
      date: dateStr,
      label: formatDateLabel(dateStr),
    };
    incomes.push({ ...point, value: snapshot?.totalIncome ?? 0 });
    expenses.push({ ...point, value: snapshot?.totalExpense ?? 0 });
  }

  return {
    incomes,
    expenses,
    currencyCode: user.mainCurrencyCode,
    period: { from: startDate, to: endDate },
  };
};

export const reportsService = {
  getSummary,
  getCategoryChart,
  getCashFlowTrend,
};
