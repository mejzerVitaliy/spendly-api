import {
  CreateTransactionInput,
  NotFoundError,
  UpdateTransactionInput,
} from '@/business/lib';
import { transactionRepository, userRepository } from '@/database/repositories';
import { TransactionType } from '@prisma/client';
import { currencyService } from '../currency/currency.service';

const create = async (userId: string, input: CreateTransactionInput) => {
  const transaction = await transactionRepository.create({
    data: {
      userId,
      ...input,
    },
  });

  if (!transaction) {
    throw NotFoundError('Transaction not created');
  }

  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const convertedAmount = await currencyService.convertAmount(
    transaction.amount,
    transaction.currency,
    user.mainCurrency,
  );

  let totalBalance;

  if (transaction.type === TransactionType.INCOME) {
    totalBalance = user.totalBalance + convertedAmount;
  } else {
    totalBalance = user.totalBalance - convertedAmount;
  }

  await userRepository.update({
    where: { id: userId },
    data: {
      totalBalance,
    },
  });

  return {
    ...transaction,
    date: transaction.date.toISOString(),
  };
};

const getAll = async (userId: string) => {
  const transactions = await transactionRepository.findMany({
    where: {
      userId,
    },
  });

  if (!transactions) {
    return [];
  }

  return transactions.map((transaction) => ({
    ...transaction,
    date: transaction.date.toISOString(),
  }));
};

const getById = async (userId: string, id: string) => {
  const transaction = await transactionRepository.findUnique({
    where: {
      id,
    },
  });

  if (!transaction) {
    throw NotFoundError('Transaction not found');
  }

  if (transaction.userId !== userId) {
    throw NotFoundError('Transaction not found');
  }

  return {
    ...transaction,
    date: transaction.date.toISOString(),
  };
};

const update = async (id: string, input: UpdateTransactionInput) => {
  const transaction = await transactionRepository.findUnique({ where: { id } });

  if (!transaction) {
    throw NotFoundError('Transaction not found');
  }

  const user = await userRepository.findUnique({
    where: { id: transaction.userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const oldAmountConverted = await currencyService.convertAmount(
    transaction.amount,
    transaction.currency,
    user.mainCurrency,
  );

  let newBalance = user.totalBalance;

  if (transaction.type === TransactionType.INCOME) {
    newBalance -= oldAmountConverted;
  } else {
    newBalance += oldAmountConverted;
  }

  const updatedTransaction = {
    ...transaction,
    ...input,
    date: new Date(input.date || transaction.date),
  };

  const finalAmountConverted = await currencyService.convertAmount(
    updatedTransaction.amount,
    updatedTransaction.currency,
    user.mainCurrency,
  );

  if (updatedTransaction.type === TransactionType.INCOME) {
    newBalance += finalAmountConverted;
  } else {
    newBalance -= finalAmountConverted;
  }

  await transactionRepository.update({
    where: { id },
    data: updatedTransaction,
  });

  await userRepository.update({
    where: { id: transaction.userId },
    data: {
      totalBalance: newBalance,
    },
  });

  return {
    ...updatedTransaction,
    date: updatedTransaction.date.toISOString(),
  };
};

const remove = async (id: string) => {
  const transaction = await transactionRepository.findUnique({
    where: {
      id,
    },
  });

  if (!transaction) {
    throw NotFoundError('Transaction not found');
  }

  const user = await userRepository.findUnique({
    where: { id: transaction.userId },
  });

  if (!transaction) {
    throw NotFoundError('Transaction not found');
  }

  if (!user) {
    throw NotFoundError('User not found');
  }

  const convertedAmount = await currencyService.convertAmount(
    transaction.amount,
    transaction.currency,
    user.mainCurrency,
  );

  let totalBalance;

  if (transaction.type === TransactionType.INCOME) {
    totalBalance = user.totalBalance - convertedAmount;
  } else {
    totalBalance = user.totalBalance + convertedAmount;
  }

  await userRepository.update({
    where: { id: transaction.userId },
    data: {
      totalBalance,
    },
  });

  await transactionRepository.delete({
    where: {
      id,
    },
  });
};

export const transactionService = {
  create,
  getAll,
  getById,
  update,
  remove,
};
