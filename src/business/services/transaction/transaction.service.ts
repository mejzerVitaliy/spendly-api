import {
  CreateTransactionInput,
  CreateTransferInput,
  NotFoundError,
  UpdateTransactionInput,
  BadRequestError,
  RecurringPeriod,
} from '@/business/lib';
import { randomUUID } from 'crypto';
import {
  categoryRepository,
  transactionRepository,
  userRepository,
  walletRepository,
} from '@/database/repositories';
import { parseTransaction, transcribeAudio } from '@/bootstrap/openai';
import { TransactionType } from '@prisma/client';
import { currencyService } from '../currency/currency.service';
import { snapshotService } from '../snapshot/snapshot.service';

const userMutex = new Map<string, Promise<void>>();

const withUserLock = <T>(userId: string, fn: () => Promise<T>): Promise<T> => {
  const prev = userMutex.get(userId) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  userMutex.set(userId, next);
  return prev.then(fn).finally(() => {
    release();
    if (userMutex.get(userId) === next) userMutex.delete(userId);
  });
};

interface PreparedTransaction {
  walletId: string;
  mainCurrencyCode: string;
  convertedAmount: number;
  input: CreateTransactionInput;
}

const prepareTransaction = async (
  userId: string,
  input: CreateTransactionInput,
): Promise<PreparedTransaction> => {
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

  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const convertedAmountRaw = await currencyService.convertAmount(
    input.amount,
    input.currencyCode,
    user.mainCurrencyCode,
  );

  return {
    walletId,
    mainCurrencyCode: user.mainCurrencyCode,
    convertedAmount: Math.round(convertedAmountRaw),
    input,
  };
};

const finalizeTransaction = async (
  userId: string,
  prepared: PreparedTransaction,
) => {
  const { walletId, mainCurrencyCode, convertedAmount, input } = prepared;

  const transaction = await transactionRepository.create({
    data: { userId, ...input, walletId },
  });

  if (!transaction) {
    throw NotFoundError('Transaction not created');
  }

  const user = await userRepository.findUnique({ where: { id: userId } });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const delta =
    transaction.type === TransactionType.INCOME
      ? convertedAmount
      : -convertedAmount;

  await userRepository.update({
    where: { id: userId },
    data: { totalBalance: user.totalBalance + delta },
  });

  await snapshotService.createOrUpdateSnapshot({
    userId,
    date: transaction.date,
    amount: convertedAmount,
    type: transaction.type,
    currencyCode: mainCurrencyCode,
  });

  return {
    ...transaction,
    date: transaction.date.toISOString(),
    nextRecurringDate:
      transaction.nextRecurringDate instanceof Date
        ? transaction.nextRecurringDate.toISOString()
        : (transaction.nextRecurringDate ?? null),
  };
};

function computeNextRecurringDate(from: Date, period: RecurringPeriod): Date {
  const d = new Date(from);
  switch (period) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'BIWEEKLY':
      d.setDate(d.getDate() + 14);
      break;
    case 'MONTHLY':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'SEMIANNUAL':
      d.setMonth(d.getMonth() + 6);
      break;
    case 'ANNUAL':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

const create = async (userId: string, input: CreateTransactionInput) => {
  const nextRecurringDate =
    input.isRecurring && input.recurringPeriod
      ? computeNextRecurringDate(
          new Date(input.date),
          input.recurringPeriod as RecurringPeriod,
        )
      : undefined;

  const enrichedInput = {
    ...input,
    nextRecurringDate: nextRecurringDate ?? null,
  };

  const prepared = await prepareTransaction(userId, enrichedInput as any);
  return withUserLock(userId, () => finalizeTransaction(userId, prepared));
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
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
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
        nextRecurringDate:
          transaction.nextRecurringDate instanceof Date
            ? transaction.nextRecurringDate.toISOString()
            : (transaction.nextRecurringDate ?? null),
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

  let pairedTransactionWalletId: string | null = null;
  let pairedTransactionCurrencyCode: string | null = null;
  let pairedTransactionAmount: number | null = null;

  if (transaction.transferGroupId) {
    const paired = await transactionRepository.findFirst({
      where: { transferGroupId: transaction.transferGroupId, id: { not: id } },
    });
    if (paired) {
      pairedTransactionWalletId = paired.walletId;
      pairedTransactionCurrencyCode = paired.currencyCode;
      pairedTransactionAmount = paired.amount;
    }
  }

  return {
    ...transaction,
    date: transaction.date.toISOString(),
    nextRecurringDate:
      transaction.nextRecurringDate instanceof Date
        ? transaction.nextRecurringDate.toISOString()
        : (transaction.nextRecurringDate ?? null),
    convertedAmount: Math.round(convertedAmount),
    mainCurrencyCode: user.mainCurrencyCode,
    pairedTransactionWalletId,
    pairedTransactionCurrencyCode,
    pairedTransactionAmount,
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

  const nextRecurringDateForUpdate =
    input.isRecurring && input.recurringPeriod
      ? computeNextRecurringDate(
          updatedTransaction.date,
          input.recurringPeriod as RecurringPeriod,
        )
      : null;

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
      isRecurring: input.isRecurring ?? false,
      recurringPeriod: input.isRecurring
        ? (input.recurringPeriod ?? null)
        : null,
      nextRecurringDate: nextRecurringDateForUpdate,
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
    nextRecurringDate:
      updatedTransaction.nextRecurringDate instanceof Date
        ? updatedTransaction.nextRecurringDate.toISOString()
        : ((updatedTransaction.nextRecurringDate as
            | string
            | null
            | undefined) ?? null),
  };
};

const removeSingle = async (
  transaction: {
    id: string;
    userId: string;
    amount: number;
    currencyCode: string;
    type: TransactionType;
    date: Date;
  },
  user: { id: string; totalBalance: number; mainCurrencyCode: string },
) => {
  const convertedAmount = await currencyService.convertAmount(
    transaction.amount,
    transaction.currencyCode,
    user.mainCurrencyCode,
  );

  const delta =
    transaction.type === TransactionType.INCOME
      ? -convertedAmount
      : convertedAmount;

  await snapshotService.removeTransactionFromSnapshot(
    transaction.userId,
    transaction.date,
    convertedAmount,
    transaction.type,
  );

  await transactionRepository.delete({ where: { id: transaction.id } });

  return delta;
};

const remove = async (id: string) => {
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

  return withUserLock(transaction.userId, async () => {
    const freshUser = await userRepository.findUnique({
      where: { id: transaction.userId },
    });
    if (!freshUser) throw NotFoundError('User not found');

    let balanceDelta = await removeSingle(transaction, freshUser);

    // If this is part of a transfer, also remove the paired transaction
    if (transaction.transferGroupId) {
      const paired = await transactionRepository.findFirst({
        where: {
          transferGroupId: transaction.transferGroupId,
          id: { not: id },
        },
      });

      if (paired) {
        balanceDelta += await removeSingle(paired, freshUser);
      }
    }

    await userRepository.update({
      where: { id: transaction.userId },
      data: { totalBalance: freshUser.totalBalance + Math.round(balanceDelta) },
    });
  });
};

const createTransfer = async (userId: string, input: CreateTransferInput) => {
  const { fromWalletId, toWalletId, fromAmount, date, description } = input;

  const [fromWallet, toWallet] = await Promise.all([
    walletRepository.findFirst({
      where: { id: fromWalletId, userId, isArchived: false },
    }),
    walletRepository.findFirst({
      where: { id: toWalletId, userId, isArchived: false },
    }),
  ]);

  if (!fromWallet) throw new BadRequestError('Source wallet not found');
  if (!toWallet) throw new BadRequestError('Destination wallet not found');
  if (fromWalletId === toWalletId)
    throw new BadRequestError(
      'Source and destination wallets must be different',
    );

  const user = await userRepository.findUnique({ where: { id: userId } });
  if (!user) throw NotFoundError('User not found');

  const fromCurrency = fromWallet.currencyCode;
  const toCurrency = toWallet.currencyCode;

  let toAmount: number;
  let exchangeRate: number;

  if (fromCurrency === toCurrency) {
    exchangeRate = 1;
    toAmount = fromAmount;
  } else {
    exchangeRate = await currencyService.getExchangeRate(
      fromCurrency,
      toCurrency,
    );
    toAmount = Math.round(fromAmount * exchangeRate);
  }

  const transferGroupId = randomUUID();
  const transactionDate = new Date(date);

  const [fromAmountInMain, toAmountInMain] = await Promise.all([
    currencyService.convertAmount(
      fromAmount,
      fromCurrency,
      user.mainCurrencyCode,
    ),
    currencyService.convertAmount(toAmount, toCurrency, user.mainCurrencyCode),
  ]);

  return withUserLock(userId, async () => {
    const freshUser = await userRepository.findUnique({
      where: { id: userId },
    });
    if (!freshUser) throw NotFoundError('User not found');

    const fromTransaction = await transactionRepository.create({
      data: {
        userId,
        walletId: fromWalletId,
        amount: fromAmount,
        currencyCode: fromCurrency,
        type: TransactionType.EXPENSE,
        date: transactionDate,
        description,
        transferGroupId,
      },
    });

    const toTransaction = await transactionRepository.create({
      data: {
        userId,
        walletId: toWalletId,
        amount: toAmount,
        currencyCode: toCurrency,
        type: TransactionType.INCOME,
        date: transactionDate,
        description,
        transferGroupId,
      },
    });

    // Net effect on total balance: +toAmountInMain - fromAmountInMain
    const balanceDelta = Math.round(toAmountInMain - fromAmountInMain);
    await userRepository.update({
      where: { id: userId },
      data: { totalBalance: freshUser.totalBalance + balanceDelta },
    });

    await snapshotService.createOrUpdateSnapshot({
      userId,
      date: transactionDate,
      amount: Math.round(fromAmountInMain),
      type: TransactionType.EXPENSE,
      currencyCode: user.mainCurrencyCode,
    });
    await snapshotService.createOrUpdateSnapshot({
      userId,
      date: transactionDate,
      amount: Math.round(toAmountInMain),
      type: TransactionType.INCOME,
      currencyCode: user.mainCurrencyCode,
    });

    return {
      fromTransaction: {
        ...fromTransaction,
        date: fromTransaction.date.toISOString(),
      },
      toTransaction: {
        ...toTransaction,
        date: toTransaction.date.toISOString(),
      },
      exchangeRate,
      fromCurrencyCode: fromCurrency,
      toCurrencyCode: toCurrency,
      fromAmount,
      toAmount,
    };
  });
};

const DEFAULT_CATEGORY_NAME = 'Unexpected Expenses';

const getParseContext = async (userId: string) => {
  const [user, categories, wallets] = await Promise.all([
    userRepository.findUnique({ where: { id: userId } }),
    categoryRepository.findMany({
      select: { id: true, name: true, type: true },
    }),
    walletRepository.findMany({
      where: { userId, isArchived: false },
      select: { id: true, name: true, currencyCode: true },
    }),
  ]);

  if (!user) throw NotFoundError('User not found');

  return {
    user,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type as string,
    })),
    wallets: wallets.map((w) => ({
      id: w.id,
      name: w.name,
      currencyCode: w.currencyCode,
    })),
  };
};

const createFromText = async (
  userId: string,
  text: string,
  isVoice = false,
) => {
  const { user, categories, wallets } = await getParseContext(userId);

  const parsed = await parseTransaction({
    mainCurrency: user.mainCurrencyCode,
    todayDate: new Date().toISOString().split('T')[0],
    categories,
    wallets,
    userText: text,
    isVoice,
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

  const created: any[] = [];

  for (const tx of parsed.transactions) {
    try {
      if (tx.transactionType === 'TRANSFER') {
        if (!tx.walletId || !tx.toWalletId) continue;
        const result = await createTransfer(userId, {
          fromWalletId: tx.walletId,
          toWalletId: tx.toWalletId,
          fromAmount: tx.amount,
          date: new Date(tx.date).toISOString(),
          description: tx.description || undefined,
        });
        created.push(result.fromTransaction);
      } else {
        const input: CreateTransactionInput = {
          amount: tx.amount,
          currencyCode: tx.currencyCode,
          type: tx.transactionType as TransactionType,
          categoryId: tx.categoryId ?? fallbackCategory.id,
          walletId: tx.walletId ?? undefined,
          description: tx.description || undefined,
          date: new Date(tx.date).toISOString(),
          isRecurring: false,
          createdFromRecurring: false,
        };
        const prepared = await prepareTransaction(userId, input);
        const transaction = await withUserLock(userId, () =>
          finalizeTransaction(userId, prepared),
        );
        created.push(transaction);
      }
    } catch {
      // continue with remaining
    }
  }

  if (created.length === 0) {
    throw new BadRequestError('Failed to create any transactions');
  }

  return created;
};

const previewText = async (userId: string, text: string, isVoice = false) => {
  const { user, categories, wallets } = await getParseContext(userId);

  const parsed = await parseTransaction({
    mainCurrency: user.mainCurrencyCode,
    todayDate: new Date().toISOString().split('T')[0],
    categories,
    wallets,
    userText: text,
    isVoice,
  });

  if (!parsed.success || parsed.transactions.length === 0) {
    throw new BadRequestError(parsed.error ?? 'Failed to parse transaction');
  }

  const fallbackCategory = await categoryRepository.findByName(
    DEFAULT_CATEGORY_NAME,
  );

  const transactions = parsed.transactions.map((tx) => ({
    ...tx,
    categoryId:
      tx.transactionType !== 'TRANSFER'
        ? (tx.categoryId ?? fallbackCategory?.id ?? null)
        : null,
  }));

  return { transactions };
};

const previewVoice = async (
  userId: string,
  audioBuffer: Buffer,
  filename: string,
) => {
  const transcribedText = await transcribeAudio(audioBuffer, filename);
  return previewText(userId, transcribedText, true);
};

const createFromVoice = async (
  userId: string,
  audioBuffer: Buffer,
  filename: string,
) => {
  const transcribedText = await transcribeAudio(audioBuffer, filename);
  // isVoice=true tells the parser to handle speech fillers/artifacts in its prompt
  return createFromText(userId, transcribedText, true);
};

interface UpdateTransferInput {
  fromWalletId?: string;
  toWalletId?: string;
  fromAmount: number;
  date: string;
  description?: string;
}

const updateTransfer = async (
  userId: string,
  transferGroupId: string,
  input: UpdateTransferInput,
) => {
  const allTransactions = await transactionRepository.findMany({
    where: { transferGroupId },
  });

  const expenseTx = allTransactions.find(
    (t) => t.type === TransactionType.EXPENSE,
  );
  const incomeTx = allTransactions.find(
    (t) => t.type === TransactionType.INCOME,
  );

  if (!expenseTx || !incomeTx) throw NotFoundError('Transfer not found');
  if (expenseTx.userId !== userId) throw NotFoundError('Transfer not found');

  const user = await userRepository.findUnique({ where: { id: userId } });
  if (!user) throw NotFoundError('User not found');

  // Resolve effective wallet IDs (fall back to existing if not provided)
  const newFromWalletId = input.fromWalletId ?? expenseTx.walletId;
  const newToWalletId = input.toWalletId ?? incomeTx.walletId;

  if (newFromWalletId === newToWalletId) {
    throw new BadRequestError(
      'Source and destination wallets must be different',
    );
  }

  // Fetch wallets to get their currencies (only if wallet changed)
  const walletIdsToFetch = new Set<string>();
  if (input.fromWalletId && input.fromWalletId !== expenseTx.walletId)
    walletIdsToFetch.add(input.fromWalletId);
  if (input.toWalletId && input.toWalletId !== incomeTx.walletId)
    walletIdsToFetch.add(input.toWalletId);

  const fetchedWallets =
    walletIdsToFetch.size > 0
      ? await walletRepository.findMany({
          where: {
            id: { in: [...walletIdsToFetch] },
            userId,
            isArchived: false,
          },
        })
      : [];

  const getWalletCurrency = (walletId: string, fallbackCurrency: string) => {
    const found = fetchedWallets.find((w) => w.id === walletId);
    return found ? found.currencyCode : fallbackCurrency;
  };

  const fromCurrency = getWalletCurrency(
    newFromWalletId,
    expenseTx.currencyCode,
  );
  const toCurrency = getWalletCurrency(newToWalletId, incomeTx.currencyCode);

  const newFromAmount = input.fromAmount;
  const newToAmount =
    fromCurrency === toCurrency
      ? newFromAmount
      : Math.round(
          newFromAmount *
            (await currencyService.getExchangeRate(fromCurrency, toCurrency)),
        );

  const newDate = new Date(input.date);
  const newDescription =
    input.description ?? expenseTx.description ?? undefined;

  const [oldFromInMain, oldToInMain, newFromInMain, newToInMain] =
    await Promise.all([
      currencyService.convertAmount(
        expenseTx.amount,
        expenseTx.currencyCode,
        user.mainCurrencyCode,
      ),
      currencyService.convertAmount(
        incomeTx.amount,
        incomeTx.currencyCode,
        user.mainCurrencyCode,
      ),
      currencyService.convertAmount(
        newFromAmount,
        fromCurrency,
        user.mainCurrencyCode,
      ),
      currencyService.convertAmount(
        newToAmount,
        toCurrency,
        user.mainCurrencyCode,
      ),
    ]);

  return withUserLock(userId, async () => {
    const freshUser = await userRepository.findUnique({
      where: { id: userId },
    });
    if (!freshUser) throw NotFoundError('User not found');

    await snapshotService.removeTransactionFromSnapshot(
      userId,
      expenseTx.date,
      Math.round(oldFromInMain),
      TransactionType.EXPENSE,
    );
    await snapshotService.removeTransactionFromSnapshot(
      userId,
      incomeTx.date,
      Math.round(oldToInMain),
      TransactionType.INCOME,
    );

    await transactionRepository.update({
      where: { id: expenseTx.id },
      data: {
        walletId: newFromWalletId,
        currencyCode: fromCurrency,
        amount: newFromAmount,
        date: newDate,
        description: newDescription,
      },
    });
    await transactionRepository.update({
      where: { id: incomeTx.id },
      data: {
        walletId: newToWalletId,
        currencyCode: toCurrency,
        amount: newToAmount,
        date: newDate,
        description: newDescription,
      },
    });

    const balanceDelta = Math.round(
      newToInMain - newFromInMain - oldToInMain + oldFromInMain,
    );
    await userRepository.update({
      where: { id: userId },
      data: { totalBalance: freshUser.totalBalance + balanceDelta },
    });

    await snapshotService.createOrUpdateSnapshot({
      userId,
      date: newDate,
      amount: Math.round(newFromInMain),
      type: TransactionType.EXPENSE,
      currencyCode: user.mainCurrencyCode,
    });
    await snapshotService.createOrUpdateSnapshot({
      userId,
      date: newDate,
      amount: Math.round(newToInMain),
      type: TransactionType.INCOME,
      currencyCode: user.mainCurrencyCode,
    });

    return {
      fromTransaction: {
        ...expenseTx,
        walletId: newFromWalletId,
        currencyCode: fromCurrency,
        amount: newFromAmount,
        date: newDate.toISOString(),
        description: newDescription ?? null,
      },
      toTransaction: {
        ...incomeTx,
        walletId: newToWalletId,
        currencyCode: toCurrency,
        amount: newToAmount,
        date: newDate.toISOString(),
        description: newDescription ?? null,
      },
    };
  });
};

const getRecurringDue = async (userId: string) => {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const transactions = await transactionRepository.findMany({
    where: {
      userId,
      isRecurring: true,
      nextRecurringDate: { lte: endOfToday },
    },
  });

  return transactions.map((tx: any) => ({
    ...tx,
    date: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
    nextRecurringDate:
      tx.nextRecurringDate instanceof Date
        ? tx.nextRecurringDate.toISOString()
        : tx.nextRecurringDate,
  }));
};

const processRecurring = async (userId: string, transactionId: string) => {
  const tx = await transactionRepository.findUnique({
    where: { id: transactionId },
  });

  if (!tx || tx.userId !== userId) throw NotFoundError('Transaction not found');
  if (!tx.isRecurring || !tx.recurringPeriod)
    throw new BadRequestError('Not a recurring transaction');

  const now = new Date();

  // Create new transaction for today
  const newInput: CreateTransactionInput = {
    amount: tx.amount,
    date: now.toISOString(),
    currencyCode: tx.currencyCode,
    type: tx.type as any,
    categoryId: tx.categoryId!,
    walletId: tx.walletId,
    description: tx.description ?? undefined,
    isRecurring: false,
    recurringPeriod: null,
    createdFromRecurring: true,
  };

  const prepared = await prepareTransaction(userId, newInput);
  const created = await withUserLock(userId, () =>
    finalizeTransaction(userId, prepared),
  );

  // Advance nextRecurringDate on the template
  const nextDate = computeNextRecurringDate(
    tx.nextRecurringDate ?? now,
    tx.recurringPeriod as RecurringPeriod,
  );

  await transactionRepository.update({
    where: { id: transactionId },
    data: { nextRecurringDate: nextDate },
  });

  return {
    created,
    nextRecurringDate: nextDate.toISOString(),
  };
};

const countCreatedFromRecurringToday = async (
  userId: string,
  startOfToday: Date,
) => {
  const txs = await transactionRepository.findMany({
    where: {
      userId,
      createdFromRecurring: true,
      createdAt: { gte: startOfToday },
    },
  });
  return txs.length;
};

const processAllRecurringDue = async () => {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const dueTxs = await transactionRepository.findMany({
    where: {
      isRecurring: true,
      nextRecurringDate: { lte: endOfToday },
    },
  });

  let processed = 0;
  let failed = 0;

  for (const tx of dueTxs) {
    try {
      if (!tx.isRecurring || !tx.recurringPeriod || !tx.userId) continue;

      const now = new Date();
      const newInput: CreateTransactionInput = {
        amount: tx.amount,
        date: now.toISOString(),
        currencyCode: tx.currencyCode,
        type: tx.type as any,
        categoryId: tx.categoryId!,
        walletId: tx.walletId,
        description: tx.description ?? undefined,
        isRecurring: false,
        recurringPeriod: null,
        createdFromRecurring: true,
      };

      const prepared = await prepareTransaction(tx.userId, newInput);
      await withUserLock(tx.userId, () =>
        finalizeTransaction(tx.userId, prepared),
      );

      const nextDate = computeNextRecurringDate(
        tx.nextRecurringDate ?? now,
        tx.recurringPeriod as RecurringPeriod,
      );

      await transactionRepository.update({
        where: { id: tx.id },
        data: { nextRecurringDate: nextDate },
      });

      processed++;
    } catch {
      failed++;
    }
  }

  return { processed, failed, total: dueTxs.length };
};

export const transactionService = {
  create,
  createTransfer,
  updateTransfer,
  createFromText,
  createFromVoice,
  previewText,
  previewVoice,
  getAll,
  getById,
  update,
  remove,
  getRecurringDue,
  processRecurring,
  processAllRecurringDue,
  countCreatedFromRecurringToday,
};
