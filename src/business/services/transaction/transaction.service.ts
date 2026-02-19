import {
  CreateTransactionInput,
  NotFoundError,
  UpdateTransactionInput,
  BadRequestError,
} from '@/business/lib';
import {
  categoryRepository,
  transactionRepository,
  userRepository,
  walletRepository,
} from '@/database/repositories';
import { parseTextTransaction } from '@/bootstrap/openai';
import { TransactionType } from '@prisma/client';
import { currencyService } from '../currency/currency.service';
import { snapshotService } from '../snapshot/snapshot.service';

const create = async (userId: string, input: CreateTransactionInput) => {
  let walletId = input.walletId;

  if (!walletId) {
    const defaultWallet = await walletRepository.findFirst({
      where: { userId, isDefault: true, isArchived: false },
    });

    if (!defaultWallet) {
      throw new BadRequestError(
        'No default wallet found. Please create a wallet first.',
      );
    }

    walletId = defaultWallet.id;
  } else {
    const wallet = await walletRepository.findFirst({
      where: { id: walletId, userId, isArchived: false },
    });

    if (!wallet) {
      throw new BadRequestError('Wallet not found or is archived');
    }
  }

  const transaction = await transactionRepository.create({
    data: {
      userId,
      ...input,
      walletId,
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
    transaction.currencyCode,
    user.mainCurrencyCode,
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

  await snapshotService.createOrUpdateSnapshot({
    userId,
    date: transaction.date,
    amount: convertedAmount,
    type: transaction.type,
    currencyCode: user.mainCurrencyCode,
  });

  return {
    ...transaction,
    date: transaction.date.toISOString(),
  };
};

interface GetAllTransactionsParams {
  userId: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

const getAll = async (params: GetAllTransactionsParams) => {
  const { userId, startDate, endDate, search } = params;
  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const whereConditions: any = {
    userId,
  };

  if (startDate && endDate) {
    whereConditions.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (search) {
    whereConditions.OR = [
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        category: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  const transactions = await transactionRepository.findMany({
    where: whereConditions,
    include: {
      category: true,
    },
    orderBy: {
      date: 'desc',
    },
  });

  if (!transactions) {
    return [];
  }

  const result = await Promise.all(
    transactions.map(async (transaction) => {
      const convertedAmount = await currencyService.convertAmount(
        transaction.amount,
        transaction.currencyCode,
        user.mainCurrencyCode,
      );

      const resultTransaction = {
        ...transaction,
        date: transaction.date.toISOString(),
        convertedAmount: Math.round(convertedAmount),
        mainCurrencyCode: user.mainCurrencyCode,
      };

      console.log(
        'Transaction with category:',
        JSON.stringify(resultTransaction, null, 2),
      );

      return resultTransaction;
    }),
  );

  return result;
};

const getById = async (userId: string, id: string) => {
  const transaction = await transactionRepository.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
    },
  });

  if (!transaction) {
    throw NotFoundError('Transaction not found');
  }

  if (transaction.userId !== userId) {
    throw NotFoundError('Transaction not found');
  }

  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const convertedAmount = await currencyService.convertAmount(
    transaction.amount,
    transaction.currencyCode,
    user.mainCurrencyCode,
  );

  return {
    ...transaction,
    date: transaction.date.toISOString(),
    convertedAmount: Math.round(convertedAmount),
    mainCurrencyCode: user.mainCurrencyCode,
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
    transaction.currencyCode,
    user.mainCurrencyCode,
  );

  let newBalance = user.totalBalance;

  if (transaction.type === TransactionType.INCOME) {
    newBalance -= oldAmountConverted;
  } else {
    newBalance += oldAmountConverted;
  }

  await snapshotService.removeTransactionFromSnapshot(
    transaction.userId,
    transaction.date,
    oldAmountConverted,
    transaction.type,
  );

  const updatedTransaction = {
    ...transaction,
    ...input,
    date: new Date(input.date || transaction.date),
  };

  const finalAmountConverted = await currencyService.convertAmount(
    updatedTransaction.amount,
    updatedTransaction.currencyCode,
    user.mainCurrencyCode,
  );

  if (updatedTransaction.type === TransactionType.INCOME) {
    newBalance += finalAmountConverted;
  } else {
    newBalance -= finalAmountConverted;
  }

  await transactionRepository.update({
    where: { id },
    data: {
      description: updatedTransaction.description,
      amount: updatedTransaction.amount,
      type: updatedTransaction.type,
      date: updatedTransaction.date,
      categoryId: updatedTransaction.categoryId,
      currencyCode: updatedTransaction.currencyCode,
      walletId: updatedTransaction.walletId,
    },
  });

  await userRepository.update({
    where: { id: transaction.userId },
    data: {
      totalBalance: newBalance,
    },
  });

  await snapshotService.createOrUpdateSnapshot({
    userId: transaction.userId,
    date: updatedTransaction.date,
    amount: finalAmountConverted,
    type: updatedTransaction.type,
    currencyCode: user.mainCurrencyCode,
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
    transaction.currencyCode,
    user.mainCurrencyCode,
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

  await snapshotService.removeTransactionFromSnapshot(
    transaction.userId,
    transaction.date,
    convertedAmount,
    transaction.type,
  );

  await transactionRepository.delete({
    where: {
      id,
    },
  });
};

const DEFAULT_CATEGORY_NAME = 'Unexpected Expenses';

const createFromText = async (userId: string, text: string) => {
  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const categories = await categoryRepository.findMany({
    select: { id: true, name: true, type: true },
  });

  const parsed = await parseTextTransaction({
    mainCurrency: user.mainCurrencyCode,
    todayDate: new Date().toISOString().split('T')[0],
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    })),
    userText: text,
  });

  if (!parsed.success || parsed.transactions.length === 0) {
    throw new BadRequestError(
      parsed.error ?? 'Failed to parse transaction from text',
    );
  }

  const fallbackCategory = await categoryRepository.findByName(
    DEFAULT_CATEGORY_NAME,
  );

  if (!fallbackCategory) {
    throw new BadRequestError('Default category not found');
  }

  const results = await Promise.allSettled(
    parsed.transactions.map((item) =>
      create(userId, {
        amount: item.amount,
        currencyCode: item.currencyCode,
        type: item.type,
        categoryId: item.categoryId ?? fallbackCategory.id,
        walletId: item.walletId ?? undefined,
        description: item.description,
        date: new Date(item.date).toISOString(),
      }),
    ),
  );

  const created = results
    .filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof create>>> =>
        r.status === 'fulfilled',
    )
    .map((r) => r.value);

  if (created.length === 0) {
    throw new BadRequestError('Failed to create any transactions');
  }

  return created;
};

export const transactionService = {
  create,
  createFromText,
  getAll,
  getById,
  update,
  remove,
};
