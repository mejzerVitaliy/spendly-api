import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/config', () => ({ environmentVariables: {} }));
vi.mock('@/database/repositories', () => ({
  walletRepository: {},
  transactionRepository: { findMany: vi.fn() },
  userRepository: {},
}));
vi.mock('../currency/currency.service', () => ({
  currencyService: { convertAmount: vi.fn() },
}));

import { walletService } from './wallet.service';
import { transactionRepository } from '@/database/repositories';
import { currencyService } from '../currency/currency.service';

const findMany = transactionRepository.findMany as Mock;
const convertAmount = currencyService.convertAmount as Mock;

describe('walletService.calculateWalletBalance', () => {
  beforeEach(() => {
    findMany.mockReset();
    convertAmount.mockReset();
  });

  it('starts from the initial balance when there are no transactions', async () => {
    findMany.mockResolvedValue([]);
    const balance = await walletService.calculateWalletBalance(
      'wallet-1',
      4200,
      'USD',
    );
    expect(balance).toBe(4200);
  });

  it('adds income and subtracts expenses in the wallet currency', async () => {
    findMany.mockResolvedValue([
      { amount: 5000, type: 'INCOME', currencyCode: 'USD' },
      { amount: 2000, type: 'EXPENSE', currencyCode: 'USD' },
    ]);
    convertAmount.mockImplementation(async (amount: number) => amount);

    const balance = await walletService.calculateWalletBalance(
      'wallet-1',
      10000,
      'USD',
    );
    expect(balance).toBe(10000 + 5000 - 2000);
  });

  it('converts each transaction into the wallet currency before applying it', async () => {
    findMany.mockResolvedValue([
      { amount: 1000, type: 'INCOME', currencyCode: 'EUR' },
    ]);
    convertAmount.mockResolvedValue(1080);

    const balance = await walletService.calculateWalletBalance(
      'wallet-1',
      0,
      'USD',
    );
    expect(convertAmount).toHaveBeenCalledWith(1000, 'EUR', 'USD');
    expect(balance).toBe(1080);
  });

  it('rounds converted amounts before applying them to the balance', async () => {
    findMany.mockResolvedValue([
      { amount: 100, type: 'EXPENSE', currencyCode: 'EUR' },
    ]);
    convertAmount.mockResolvedValue(108.6);

    const balance = await walletService.calculateWalletBalance(
      'wallet-1',
      1000,
      'USD',
    );
    expect(balance).toBe(1000 - 109);
  });

  it('sums multiple transactions across mixed currencies and types', async () => {
    findMany.mockResolvedValue([
      { amount: 10000, type: 'INCOME', currencyCode: 'USD' },
      { amount: 5000, type: 'EXPENSE', currencyCode: 'EUR' },
      { amount: 2000, type: 'EXPENSE', currencyCode: 'USD' },
    ]);
    convertAmount.mockImplementation(async (amount: number, from: string) =>
      from === 'EUR' ? amount * 1.1 : amount,
    );

    const balance = await walletService.calculateWalletBalance(
      'wallet-1',
      0,
      'USD',
    );
    // +10000 (USD income) -5500 (EUR expense converted) -2000 (USD expense)
    expect(balance).toBe(10000 - 5500 - 2000);
  });
});
