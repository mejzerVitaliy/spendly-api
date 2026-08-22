import {
  CreateWalletInput,
  UpdateWalletInput,
  NotFoundError,
  BadRequestError,
} from '@/business/lib';
import {
  walletRepository,
  transactionRepository,
  userRepository,
} from '@/database/repositories';
import { prisma, Prisma } from '@/database/prisma/prisma';
import { TransactionType, WalletType } from '@prisma/client';
import { currencyService } from '../currency/currency.service';

/**
 * Serializable transactions can lose a write race to a concurrent one -
 * Prisma surfaces that as P2034 and expects the caller to retry
 * (https://www.prisma.io/docs/orm/prisma-client/queries/transactions#retrying-transactions).
 */
const withSerializableRetry = async <T>(
  fn: () => Promise<T>,
  retriesLeft = 5,
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    const isWriteConflict =
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2034';
    if (!isWriteConflict || retriesLeft <= 0) throw err;
    const jitterMs = Math.floor(Math.random() * 40) + 10;
    await new Promise((resolve) => setTimeout(resolve, jitterMs));
    return withSerializableRetry(fn, retriesLeft - 1);
  }
};

const create = async (userId: string, input: CreateWalletInput) => {
  const existingWallet = await walletRepository.findFirst({
    where: {
      userId,
      name: input.name,
    },
  });

  if (existingWallet) {
    throw new BadRequestError('Wallet with this name already exists');
  }

  // Serializable so a concurrent create for the same brand-new user can't
  // both read walletsCount === 0 and both end up isDefault: true.
  const wallet = await withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const walletsCount = await walletRepository.count(
          { where: { userId, isArchived: false } },
          tx,
        );
        const isFirst = walletsCount === 0;

        return walletRepository.create(
          {
            data: {
              userId,
              name: input.name,
              currencyCode: input.currencyCode,
              type: input.type || WalletType.CASH,
              initialBalance: input.initialBalance || 0,
              isDefault: isFirst,
              isArchived: false,
            },
          },
          tx,
        );
      },
      { isolationLevel: 'Serializable' },
    ),
  );

  return {
    ...wallet,
    currentBalance: wallet.initialBalance,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
  };
};

const getAll = async (userId: string, includeArchived = false) => {
  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const wallets = await walletRepository.findMany({
    where: {
      userId,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });

  const walletsWithBalance = await Promise.all(
    wallets.map(async (wallet) => {
      const currentBalance = await calculateWalletBalance(
        userId,
        wallet.id,
        wallet.initialBalance,
        wallet.currencyCode,
      );
      const convertedBalance = await currencyService.convertAmount(
        currentBalance,
        wallet.currencyCode,
        user.mainCurrencyCode,
      );
      return {
        ...wallet,
        currentBalance,
        convertedBalance: Math.round(convertedBalance),
        mainCurrencyCode: user.mainCurrencyCode,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
      };
    }),
  );

  return walletsWithBalance;
};

const getById = async (userId: string, walletId: string) => {
  const wallet = await walletRepository.findUnique({
    where: { id: walletId },
  });

  if (!wallet || wallet.userId !== userId) {
    throw NotFoundError('Wallet not found');
  }

  const currentBalance = await calculateWalletBalance(
    userId,
    wallet.id,
    wallet.initialBalance,
    wallet.currencyCode,
  );

  return {
    ...wallet,
    currentBalance,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
  };
};

const getDefaultWallet = async (userId: string) => {
  const wallet = await walletRepository.findFirst({
    where: {
      userId,
      isDefault: true,
      isArchived: false,
    },
  });

  if (!wallet) {
    throw NotFoundError('Default wallet not found');
  }

  const currentBalance = await calculateWalletBalance(
    userId,
    wallet.id,
    wallet.initialBalance,
    wallet.currencyCode,
  );

  return {
    ...wallet,
    currentBalance,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
  };
};

const update = async (
  userId: string,
  walletId: string,
  input: UpdateWalletInput,
) => {
  const wallet = await walletRepository.findUnique({
    where: { id: walletId },
  });

  if (!wallet || wallet.userId !== userId) {
    throw NotFoundError('Wallet not found');
  }

  if (input.name && input.name !== wallet.name) {
    const existingWallet = await walletRepository.findFirst({
      where: {
        userId,
        name: input.name,
        id: { not: walletId },
      },
    });

    if (existingWallet) {
      throw new BadRequestError('Wallet with this name already exists');
    }
  }

  const updatedWallet = await walletRepository.update({
    where: { id: walletId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.type && { type: input.type }),
    },
  });

  const currentBalance = await calculateWalletBalance(
    userId,
    updatedWallet.id,
    updatedWallet.initialBalance,
    updatedWallet.currencyCode,
  );

  return {
    ...updatedWallet,
    currentBalance,
    createdAt: updatedWallet.createdAt.toISOString(),
    updatedAt: updatedWallet.updatedAt.toISOString(),
  };
};

const archive = async (userId: string, walletId: string) => {
  const wallet = await walletRepository.findUnique({
    where: { id: walletId },
  });

  if (!wallet || wallet.userId !== userId) {
    throw NotFoundError('Wallet not found');
  }

  if (wallet.isArchived) {
    throw new BadRequestError('Wallet is already archived');
  }

  const activeWalletsCount = await walletRepository.count({
    where: { userId, isArchived: false },
  });

  if (activeWalletsCount <= 1) {
    throw new BadRequestError('Cannot archive the last active wallet');
  }

  if (wallet.isDefault) {
    throw new BadRequestError(
      'Cannot archive default wallet. Set another wallet as default first',
    );
  }

  const archivedWallet = await walletRepository.update({
    where: { id: walletId },
    data: { isArchived: true },
  });

  return archivedWallet;
};

const unarchive = async (userId: string, walletId: string) => {
  const wallet = await walletRepository.findUnique({
    where: { id: walletId },
  });

  if (!wallet || wallet.userId !== userId) {
    throw NotFoundError('Wallet not found');
  }

  if (!wallet.isArchived) {
    throw new BadRequestError('Wallet is not archived');
  }

  const unarchivedWallet = await walletRepository.update({
    where: { id: walletId },
    data: { isArchived: false },
  });

  return unarchivedWallet;
};

const setDefault = async (userId: string, walletId: string) => {
  const wallet = await walletRepository.findUnique({
    where: { id: walletId },
  });

  if (!wallet || wallet.userId !== userId) {
    throw NotFoundError('Wallet not found');
  }

  if (wallet.isArchived) {
    throw new BadRequestError('Cannot set archived wallet as default');
  }

  const updatedWallet = await prisma.$transaction(async (tx) => {
    await walletRepository.updateMany(
      {
        where: { userId, isDefault: true },
        data: { isDefault: false },
      },
      tx,
    );

    return walletRepository.update(
      {
        where: { id: walletId },
        data: { isDefault: true },
      },
      tx,
    );
  });

  const currentBalance = await calculateWalletBalance(
    userId,
    updatedWallet.id,
    updatedWallet.initialBalance,
    updatedWallet.currencyCode,
  );

  return {
    ...updatedWallet,
    currentBalance,
    createdAt: updatedWallet.createdAt.toISOString(),
    updatedAt: updatedWallet.updatedAt.toISOString(),
  };
};

const getTotalBalance = async (userId: string) => {
  const user = await userRepository.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const wallets = await walletRepository.findMany({
    where: { userId, isArchived: false },
  });

  let totalBalance = 0;

  for (const wallet of wallets) {
    const balance = await calculateWalletBalance(
      userId,
      wallet.id,
      wallet.initialBalance,
      wallet.currencyCode,
    );
    const convertedBalance = await currencyService.convertAmount(
      balance,
      wallet.currencyCode,
      user.mainCurrencyCode,
    );
    totalBalance += convertedBalance;
  }

  return {
    totalBalance: Math.round(totalBalance),
    walletsCount: wallets.length,
  };
};

const calculateWalletBalance = async (
  userId: string,
  walletId: string,
  initialBalance: number,
  walletCurrencyCode: string,
): Promise<number> => {
  // Scoped to userId too, not just walletId: a transaction should never be
  // able to affect a wallet it doesn't belong to (defense in depth against
  // any future write path that fails to validate wallet ownership).
  const transactions = await transactionRepository.findMany({
    where: { walletId, userId },
    select: { amount: true, type: true, currencyCode: true },
  });

  let balance = initialBalance;

  for (const transaction of transactions) {
    const convertedAmount = await currencyService.convertAmount(
      transaction.amount,
      transaction.currencyCode,
      walletCurrencyCode,
    );

    if (transaction.type === TransactionType.INCOME) {
      balance += Math.round(convertedAmount);
    } else {
      balance -= Math.round(convertedAmount);
    }
  }

  return balance;
};

const createDefaultWallet = async (
  userId: string,
  currencyCode: string,
  initialBalance = 0,
) => {
  const wallet = await walletRepository.create({
    data: {
      userId,
      name: 'Main Wallet',
      currencyCode,
      type: WalletType.CASH,
      initialBalance,
      isDefault: true,
      isArchived: false,
    },
  });

  return {
    ...wallet,
    currentBalance: initialBalance,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
  };
};

export const walletService = {
  create,
  getAll,
  getById,
  getDefaultWallet,
  update,
  archive,
  unarchive,
  setDefault,
  getTotalBalance,
  calculateWalletBalance,
  createDefaultWallet,
};
