import {
  BalanceTrendChart,
  CategoryBarChart,
  CategoryPieChart,
  IncomesExpensesTrendChart,
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
import { COLOR_BY_CATEGORY } from '@/constans';

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

const getCategoryBarChartData = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  type?: TransactionType,
): Promise<CategoryBarChart> => {
  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const transactions = await transactionRepository.findMany({
    where: {
      userId,
      type: type || TransactionType.EXPENSE,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
  });

  const categoryMap = new Map<string, { amount: number; count: number }>();
  let totalExpenses = 0;

  for (const transaction of transactions) {
    const convertedAmount = await currencyService.convertAmount(
      transaction.amount,
      transaction.currencyCode,
      user.mainCurrencyCode,
    );

    const existing = categoryMap.get(transaction.category) || {
      amount: 0,
      count: 0,
    };
    categoryMap.set(transaction.category, {
      amount: existing.amount + convertedAmount,
      count: existing.count + 1,
    });
    totalExpenses += convertedAmount;
  }

  const categories = Array.from(categoryMap.entries()).map(
    ([category, categoryData]) => ({
      label: category,
      value: categoryData.amount,
      frontColor: '#977DFF',
    }),
  );

  categories.sort((a, b) => b.value - a.value);

  return {
    data: categories,
    totalExpenses,
    period: {
      from: startDate || null,
      to: endDate || null,
    },
  };
};

const getCategoryPieChartData = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  type?: TransactionType,
): Promise<CategoryPieChart> => {
  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const transactions = await transactionRepository.findMany({
    where: {
      userId,
      type: type || TransactionType.EXPENSE,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
  });

  const categoryMap = new Map<string, { amount: number; count: number }>();
  let totalExpenses = 0;

  for (const transaction of transactions) {
    const convertedAmount = await currencyService.convertAmount(
      transaction.amount,
      transaction.currencyCode,
      user.mainCurrencyCode,
    );

    const existing = categoryMap.get(transaction.category) || {
      amount: 0,
      count: 0,
    };
    categoryMap.set(transaction.category, {
      amount: existing.amount + convertedAmount,
      count: existing.count + 1,
    });
    totalExpenses += convertedAmount;
  }

  const pieData = Array.from(categoryMap.entries()).map(
    ([category, categoryData], index) => {
      return {
        value:
          totalExpenses > 0 ? (categoryData.amount / totalExpenses) * 100 : 0,
        color: COLOR_BY_CATEGORY[category as keyof typeof COLOR_BY_CATEGORY],
        label: category,
        focused: index === 0,
      };
    },
  );

  pieData.sort((a, b) => b.value - a.value);

  return {
    data: pieData,
    totalExpenses,
    period: {
      from: startDate || null,
      to: endDate || null,
    },
  };
};

const getIncomesExpensesTrend = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<IncomesExpensesTrendChart> => {
  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  if (!startDate || !endDate) {
    throw NotFoundError('startDate and endDate are required');
  }

  const snapshots = await dailySnapshotRepository.findMany({
    where: {
      userId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: { date: 'asc' },
  });

  const snapshotMap = new Map(
    snapshots.map((snapshot) => [
      snapshot.date.toISOString().split('T')[0],
      snapshot,
    ]),
  );

  const start = new Date(startDate);
  const end = new Date(endDate);
  const incomes = [];
  const expenses = [];

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dateStr = date.toISOString().split('T')[0];
    const snapshot = snapshotMap.get(dateStr);

    if (snapshot) {
      incomes.push({
        value: snapshot.totalIncome,
        dataPointText: snapshot.totalIncome.toString(),
        label: formatDateLabel(dateStr),
      });
      expenses.push({
        value: snapshot.totalExpense,
        dataPointText: snapshot.totalExpense.toString(),
        label: formatDateLabel(dateStr),
      });
    } else {
      incomes.push({
        value: 0,
        dataPointText: '0',
        label: formatDateLabel(dateStr),
      });
      expenses.push({
        value: 0,
        dataPointText: '0',
        label: formatDateLabel(dateStr),
      });
    }
  }

  return {
    incomes,
    expenses,
    period: {
      from: startDate,
      to: endDate,
    },
  };
};

const getBalanceTrend = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<BalanceTrendChart> => {
  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  if (!startDate || !endDate) {
    throw NotFoundError('startDate and endDate are required');
  }

  const snapshots = await dailySnapshotRepository.findMany({
    where: {
      userId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: { date: 'asc' },
  });

  const snapshotMap = new Map(
    snapshots.map((snapshot) => [
      snapshot.date.toISOString().split('T')[0],
      snapshot,
    ]),
  );

  const start = new Date(startDate);
  const end = new Date(endDate);
  const data = [];

  let previousBalance = 0;
  const firstSnapshot = await dailySnapshotRepository.findFirst({
    where: {
      userId,
      date: {
        lt: new Date(startDate),
      },
    },
    orderBy: { date: 'desc' },
  });

  if (firstSnapshot) {
    previousBalance = firstSnapshot.closingBalance;
  }

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dateStr = date.toISOString().split('T')[0];
    const snapshot = snapshotMap.get(dateStr);

    if (snapshot) {
      previousBalance = snapshot.closingBalance;
      data.push({
        value: snapshot.closingBalance,
        label: formatDateLabel(dateStr),
      });
    } else {
      data.push({
        value: previousBalance,
        label: formatDateLabel(dateStr),
      });
    }
  }

  return {
    data,
    period: {
      from: startDate,
      to: endDate,
    },
  };
};

export const reportsService = {
  getSummary,
  getCategoryBarChartData,
  getCategoryPieChartData,
  getIncomesExpensesTrend,
  getBalanceTrend,
};
