import { BadRequestError } from '@/business/lib';
import axios from 'axios';

interface CurrencyRates {
  [currency: string]: number;
}

interface CurrencyResponse {
  [key: string]: CurrencyRates;
}

const CACHE_EXPIRY = 120 * 60 * 1000;
const cache = new Map<string, { rates: CurrencyRates; timestamp: number }>();

const getRatesForCurrency = async (
  baseCurrency: string,
): Promise<CurrencyRates> => {
  const now = Date.now();
  const cached = cache.get(baseCurrency);

  if (cached && now - cached.timestamp < CACHE_EXPIRY) {
    return cached.rates;
  }

  try {
    const response = await axios.get(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseCurrency}.json`,
    );

    if (!response.data) {
      throw new BadRequestError(
        `Failed to fetch currency data for ${baseCurrency}`,
      );
    }

    const data = response.data as CurrencyResponse;
    const rates = data[baseCurrency];

    if (!rates) {
      throw new BadRequestError(`Currency ${baseCurrency} not found`);
    }

    cache.set(baseCurrency, {
      rates,
      timestamp: now,
    });

    return rates;
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    throw new BadRequestError(
      `Failed to get exchange rates for ${baseCurrency}`,
    );
  }
};

const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string,
): Promise<number> => {
  try {
    const from = fromCurrency.toLowerCase();
    const to = toCurrency.toLowerCase();

    if (from === to) {
      return 1;
    }

    const rates = await getRatesForCurrency(from);

    if (rates[to]) {
      return rates[to];
    }

    const reverseRates = await getRatesForCurrency(to);

    if (reverseRates[from]) {
      return 1 / reverseRates[from];
    }

    throw new BadRequestError(
      `Exchange rate for ${fromCurrency}/${toCurrency} not found`,
    );
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    throw new BadRequestError(
      `Failed to get exchange rate: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

const convertAmount = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> => {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

const getAvailableCurrencies = async (
  baseCurrency: string = 'usd',
): Promise<string[]> => {
  const rates = await getRatesForCurrency(baseCurrency);
  return Object.keys(rates);
};

const clearCache = (): void => {
  cache.clear();
};

export const currencyService = {
  getExchangeRate,
  convertAmount,
  getAvailableCurrencies,
  clearCache,
};
