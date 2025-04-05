import { CreateTransactionInput, UpdateTransactionInput } from "@/business/lib";
import { transactionRepository } from "@/database/repositories/transactions/transaction.repository";

const create = async (data: CreateTransactionInput, userId: string) => {
  const transaction = await transactionRepository.create({
    data: {
      userId,
      ...data
    }
  });

  return transaction;
}

const getAllByUserId = async (userId: string) => {
  const transactions = await transactionRepository.findMany({
    where: {
      userId
    }
  });
  return transactions;
}

const update = async (id: string, data: UpdateTransactionInput) => {
  const transaction = await transactionRepository.update({
    where: {
      id
    },
    data
  });
  return transaction;
}

const remove = async (id: string, userId: string) => {
  await transactionRepository.delete({
    where: {
      id,
      userId
    }
  });
}

export const transactionsService = {
  create,
  getAllByUserId,
  update,
  remove
}