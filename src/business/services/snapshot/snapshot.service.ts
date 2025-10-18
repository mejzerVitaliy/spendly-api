import {
  dailySnapshotRepository,
  userRepository,
} from '@/database/repositories';
import { TransactionType, Currency } from '@prisma/client';
import {
  NotFoundError,
  SnapshotFilters,
  DailySnapshotPublic,
} from '@/business/lib';

interface CreateSnapshotData {
  userId: string;
  date: Date;
  amount: number;
  type: TransactionType;
  currency: Currency;
}

const createOrUpdateSnapshot = async (data: CreateSnapshotData) => {
  const { userId, date, amount, type } = data;

  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const existingSnapshot = await dailySnapshotRepository.findFirst({
    where: {
      userId,
      date: normalizedDate,
    },
  });

  if (existingSnapshot) {
    await updateExistingSnapshot(existingSnapshot.id, amount, type);
  } else {
    await createNewSnapshot(
      userId,
      normalizedDate,
      amount,
      type,
      user.mainCurrency,
    );
  }

  await recalculateSubsequentSnapshots(userId, normalizedDate);
};

const updateExistingSnapshot = async (
  snapshotId: string,
  amount: number,
  type: TransactionType,
) => {
  const snapshot = await dailySnapshotRepository.findUnique({
    where: { id: snapshotId },
  });

  if (!snapshot) {
    throw NotFoundError('Snapshot not found');
  }

  const isIncome = type === TransactionType.INCOME;
  const newTotalIncome = isIncome
    ? snapshot.totalIncome + amount
    : snapshot.totalIncome;
  const newTotalExpense = isIncome
    ? snapshot.totalExpense
    : snapshot.totalExpense + amount;
  const newIncomeCount = isIncome
    ? snapshot.incomeCount + 1
    : snapshot.incomeCount;
  const newExpenseCount = isIncome
    ? snapshot.expenseCount
    : snapshot.expenseCount + 1;
  const newNetChange = newTotalIncome - newTotalExpense;
  const newClosingBalance = snapshot.openingBalance + newNetChange;

  await dailySnapshotRepository.update({
    where: { id: snapshotId },
    data: {
      totalIncome: newTotalIncome,
      totalExpense: newTotalExpense,
      incomeCount: newIncomeCount,
      expenseCount: newExpenseCount,
      netChange: newNetChange,
      closingBalance: newClosingBalance,
    },
  });
};

const createNewSnapshot = async (
  userId: string,
  date: Date,
  amount: number,
  type: TransactionType,
  currency: Currency,
) => {
  const previousSnapshot = await dailySnapshotRepository.findFirst({
    where: {
      userId,
      date: {
        lt: date,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  const openingBalance = previousSnapshot ? previousSnapshot.closingBalance : 0;

  const isIncome = type === TransactionType.INCOME;
  const totalIncome = isIncome ? amount : 0;
  const totalExpense = isIncome ? 0 : amount;
  const netChange = totalIncome - totalExpense;
  const closingBalance = openingBalance + netChange;

  await dailySnapshotRepository.create({
    data: {
      userId,
      date,
      openingBalance,
      closingBalance,
      currency,
      totalIncome,
      totalExpense,
      netChange,
      incomeCount: isIncome ? 1 : 0,
      expenseCount: isIncome ? 0 : 1,
    },
  });
};

const recalculateSubsequentSnapshots = async (
  userId: string,
  fromDate: Date,
) => {
  const snapshots = await dailySnapshotRepository.findMany({
    where: {
      userId,
      date: {
        gt: fromDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  if (snapshots.length === 0) {
    return;
  }

  const baseSnapshot = await dailySnapshotRepository.findFirst({
    where: {
      userId,
      date: fromDate,
    },
  });

  let runningBalance = baseSnapshot ? baseSnapshot.closingBalance : 0;

  for (const snapshot of snapshots) {
    const openingBalance = runningBalance;
    const closingBalance = openingBalance + snapshot.netChange;

    await dailySnapshotRepository.update({
      where: { id: snapshot.id },
      data: {
        openingBalance,
        closingBalance,
      },
    });

    runningBalance = closingBalance;
  }
};

const getBalanceHistory = async (
  params: SnapshotFilters,
): Promise<DailySnapshotPublic[]> => {
  const { userId, startDate, endDate } = params;

  const snapshots = await dailySnapshotRepository.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  return snapshots.map((snapshot: any) => ({
    date: snapshot.date.toISOString().split('T')[0],
    openingBalance: snapshot.openingBalance,
    closingBalance: snapshot.closingBalance,
    totalIncome: snapshot.totalIncome,
    totalExpense: snapshot.totalExpense,
    netChange: snapshot.netChange,
    incomeCount: snapshot.incomeCount,
    expenseCount: snapshot.expenseCount,
    currency: snapshot.currency,
  }));
};

const getSnapshotByDate = async (userId: string, date: Date) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const snapshot = await dailySnapshotRepository.findFirst({
    where: {
      userId,
      date: normalizedDate,
    },
  });

  if (!snapshot) {
    throw NotFoundError('Snapshot not found for this date');
  }

  return snapshot;
};

const removeTransactionFromSnapshot = async (
  userId: string,
  date: Date,
  amount: number,
  type: TransactionType,
) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const snapshot = await dailySnapshotRepository.findFirst({
    where: {
      userId,
      date: normalizedDate,
    },
  });

  if (!snapshot) {
    throw NotFoundError('Snapshot not found');
  }

  const isIncome = type === TransactionType.INCOME;
  const newTotalIncome = isIncome
    ? snapshot.totalIncome - amount
    : snapshot.totalIncome;
  const newTotalExpense = isIncome
    ? snapshot.totalExpense
    : snapshot.totalExpense - amount;
  const newIncomeCount = isIncome
    ? snapshot.incomeCount - 1
    : snapshot.incomeCount;
  const newExpenseCount = isIncome
    ? snapshot.expenseCount
    : snapshot.expenseCount - 1;
  const newNetChange = newTotalIncome - newTotalExpense;
  const newClosingBalance = snapshot.openingBalance + newNetChange;

  await dailySnapshotRepository.update({
    where: { id: snapshot.id },
    data: {
      totalIncome: newTotalIncome,
      totalExpense: newTotalExpense,
      incomeCount: newIncomeCount,
      expenseCount: newExpenseCount,
      netChange: newNetChange,
      closingBalance: newClosingBalance,
    },
  });

  await recalculateSubsequentSnapshots(userId, normalizedDate);
};

export const snapshotService = {
  createOrUpdateSnapshot,
  getBalanceHistory,
  getSnapshotByDate,
  removeTransactionFromSnapshot,
  recalculateSubsequentSnapshots,
};
