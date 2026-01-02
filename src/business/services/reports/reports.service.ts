import { NotFoundError, ReportsSummary } from '@/business/lib';
import {
  dailySnapshotRepository,
  userRepository,
} from '@/database/repositories';

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
        currency: user.mainCurrency,
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
      currency: user.mainCurrency,
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

  if (snapshots.length === 0) {
    return {
      totalBalance: user.totalBalance,
      currency: user.mainCurrency,
      totalIncome: 0,
      totalExpense: 0,
      netChange: 0,
      incomeCount: 0,
      expenseCount: 0,
      totalTransactions: 0,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
        isAllTime: false,
      },
    };
  }

  const totalIncome = snapshots.reduce((sum, s) => sum + s.totalIncome, 0);
  const totalExpense = snapshots.reduce((sum, s) => sum + s.totalExpense, 0);
  const incomeCount = snapshots.reduce((sum, s) => sum + s.incomeCount, 0);
  const expenseCount = snapshots.reduce((sum, s) => sum + s.expenseCount, 0);
  const lastSnapshot = snapshots[snapshots.length - 1];

  return {
    totalBalance: lastSnapshot.closingBalance,
    currency: user.mainCurrency,
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

export const reportsService = {
  getSummary,
};
