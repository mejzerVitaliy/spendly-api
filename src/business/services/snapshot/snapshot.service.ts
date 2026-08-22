import {
  dailySnapshotRepository,
  userRepository,
} from '@/database/repositories';
import { DbClient } from '@/database/prisma/prisma';
import { TransactionType } from '@prisma/client';
import { NotFoundError } from '@/business/lib';

interface CreateSnapshotData {
  userId: string;
  date: Date;
  amount: number;
  type: TransactionType;
  currencyCode: string;
}

const createOrUpdateSnapshot = async (
  data: CreateSnapshotData,
  tx?: DbClient,
) => {
  const { userId, date, amount, type } = data;

  const user = await userRepository.findUnique(
    {
      where: { id: userId },
    },
    tx,
  );

  if (!user) {
    throw NotFoundError('User not found');
  }

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const existingSnapshot = await dailySnapshotRepository.findFirst(
    {
      where: {
        userId,
        date: normalizedDate,
      },
    },
    tx,
  );

  if (existingSnapshot) {
    await updateExistingSnapshot(existingSnapshot.id, amount, type, tx);
  } else {
    await createNewSnapshot(
      userId,
      normalizedDate,
      amount,
      type,
      user.mainCurrencyCode,
      tx,
    );
  }

  await recalculateSubsequentSnapshots(userId, normalizedDate, tx);
};

const updateExistingSnapshot = async (
  snapshotId: string,
  amount: number,
  type: TransactionType,
  tx?: DbClient,
) => {
  const snapshot = await dailySnapshotRepository.findUnique(
    {
      where: { id: snapshotId },
    },
    tx,
  );

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

  await dailySnapshotRepository.update(
    {
      where: { id: snapshotId },
      data: {
        totalIncome: newTotalIncome,
        totalExpense: newTotalExpense,
        incomeCount: newIncomeCount,
        expenseCount: newExpenseCount,
        netChange: newNetChange,
        closingBalance: newClosingBalance,
      },
    },
    tx,
  );
};

const createNewSnapshot = async (
  userId: string,
  date: Date,
  amount: number,
  type: TransactionType,
  currencyCode: string,
  tx?: DbClient,
) => {
  const previousSnapshot = await dailySnapshotRepository.findFirst(
    {
      where: {
        userId,
        date: {
          lt: date,
        },
      },
      orderBy: {
        date: 'desc',
      },
    },
    tx,
  );

  const openingBalance = previousSnapshot ? previousSnapshot.closingBalance : 0;

  const isIncome = type === TransactionType.INCOME;
  const totalIncome = isIncome ? amount : 0;
  const totalExpense = isIncome ? 0 : amount;
  const netChange = totalIncome - totalExpense;
  const closingBalance = openingBalance + netChange;

  await dailySnapshotRepository.create(
    {
      data: {
        userId,
        date,
        openingBalance,
        closingBalance,
        currencyCode,
        totalIncome,
        totalExpense,
        netChange,
        incomeCount: isIncome ? 1 : 0,
        expenseCount: isIncome ? 0 : 1,
      },
    },
    tx,
  );
};

const recalculateSubsequentSnapshots = async (
  userId: string,
  fromDate: Date,
  tx?: DbClient,
) => {
  const snapshots = await dailySnapshotRepository.findMany(
    {
      where: {
        userId,
        date: {
          gt: fromDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    },
    tx,
  );

  if (snapshots.length === 0) {
    return;
  }

  const baseSnapshot = await dailySnapshotRepository.findFirst(
    {
      where: {
        userId,
        date: fromDate,
      },
    },
    tx,
  );

  let runningBalance = baseSnapshot ? baseSnapshot.closingBalance : 0;

  for (const snapshot of snapshots) {
    const openingBalance = runningBalance;
    const closingBalance = openingBalance + snapshot.netChange;

    await dailySnapshotRepository.update(
      {
        where: { id: snapshot.id },
        data: {
          openingBalance,
          closingBalance,
        },
      },
      tx,
    );

    runningBalance = closingBalance;
  }
};

const removeTransactionFromSnapshot = async (
  userId: string,
  date: Date,
  amount: number,
  type: TransactionType,
  tx?: DbClient,
) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const snapshot = await dailySnapshotRepository.findFirst(
    {
      where: {
        userId,
        date: normalizedDate,
      },
    },
    tx,
  );

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

  await dailySnapshotRepository.update(
    {
      where: { id: snapshot.id },
      data: {
        totalIncome: newTotalIncome,
        totalExpense: newTotalExpense,
        incomeCount: newIncomeCount,
        expenseCount: newExpenseCount,
        netChange: newNetChange,
        closingBalance: newClosingBalance,
      },
    },
    tx,
  );

  await recalculateSubsequentSnapshots(userId, normalizedDate, tx);
};

export const snapshotService = {
  createOrUpdateSnapshot,
  removeTransactionFromSnapshot,
  recalculateSubsequentSnapshots,
};
