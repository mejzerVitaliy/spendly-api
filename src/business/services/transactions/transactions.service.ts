import { CreateTransactionInput, NotFoundError, UpdateTransactionInput } from "@/business/lib";
import { categoryRepository } from "@/database/repositories/categories/category.repository";
import { transactionRepository } from "@/database/repositories/transactions/transaction.repository";

const create = async (data: CreateTransactionInput, userId: string) => {
  if (data.categoryId) {
    const category = await categoryRepository.findUnique({
      where: {
        id: data.categoryId
      }
    })

    if (!category) {
      throw new NotFoundError('Category not found')
    }

    if (data.type && category.type !== data.type) {
      throw new Error('Transaction type must match category type');
    }

    if (category.userId && category.userId !== userId) {
      throw new Error('Cannot use category from another user');
    }
  }
  

  const transaction = await transactionRepository.create({
    data: {
      userId,
      categoryId: data.categoryId || null,
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