import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));
vi.mock('@/config', () => ({ environmentVariables: {} }));
vi.mock('@/database/repositories', () => ({
  currencyRepository: {},
}));

import axios from 'axios';
import { currencyService } from './currency.service';

const get = axios.get as unknown as Mock;

describe('currencyService.getExchangeRate', () => {
  beforeEach(() => {
    currencyService.clearCache();
    get.mockReset();
  });

  it('returns 1 for identical currencies without calling the API', async () => {
    const rate = await currencyService.getExchangeRate('USD', 'usd');
    expect(rate).toBe(1);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns the direct rate when the base currency lists it', async () => {
    get.mockResolvedValueOnce({ data: { usd: { eur: 0.92 } } });
    const rate = await currencyService.getExchangeRate('USD', 'EUR');
    expect(rate).toBe(0.92);
  });

  it('falls back to the inverse of the reverse rate when no direct rate exists', async () => {
    get
      .mockResolvedValueOnce({ data: { usd: {} } })
      .mockResolvedValueOnce({ data: { eur: { usd: 1.08 } } });

    const rate = await currencyService.getExchangeRate('USD', 'EUR');
    expect(rate).toBeCloseTo(1 / 1.08);
  });

  it('throws when neither direction has a rate', async () => {
    get
      .mockResolvedValueOnce({ data: { usd: {} } })
      .mockResolvedValueOnce({ data: { eur: {} } });

    await expect(
      currencyService.getExchangeRate('USD', 'EUR'),
    ).rejects.toThrow();
  });

  it('caches rates for a base currency instead of refetching', async () => {
    get.mockResolvedValueOnce({ data: { usd: { eur: 0.92, gbp: 0.79 } } });

    await currencyService.getExchangeRate('USD', 'EUR');
    await currencyService.getExchangeRate('USD', 'GBP');

    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('currencyService.convertAmount', () => {
  beforeEach(() => {
    currencyService.clearCache();
    get.mockReset();
  });

  it('multiplies the amount by the exchange rate', async () => {
    get.mockResolvedValueOnce({ data: { usd: { eur: 0.5 } } });
    const converted = await currencyService.convertAmount(1000, 'USD', 'EUR');
    expect(converted).toBe(500);
  });

  it('is a no-op for a same-currency conversion', async () => {
    const converted = await currencyService.convertAmount(1234, 'usd', 'USD');
    expect(converted).toBe(1234);
  });
});
