import {
  CreateTransactionInput,
  NotFoundError,
  UpdateTransactionInput,
} from '@/business/lib';
import { transactionRepository } from '@/database/repositories';

const create = async (userId: string, input: CreateTransactionInput) => {
  const transaction = await transactionRepository.create({
    data: {
      userId,
      ...input,
    },
  });

  return transaction;
};

const getAll = async (userId: string) => {
  const transactions = await transactionRepository.findMany({
    where: {
      userId,
    },
  });

  if (!transactions) {
    throw NotFoundError('Transactions not found');
  }

  return transactions;
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

  return transaction;
};

const update = async (id: string, input: UpdateTransactionInput) => {
  const transaction = await transactionRepository.update({
    where: {
      id,
    },
    data: {
      ...input,
    },
  });

  return transaction;
};

const remove = async (id: string) => {
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
