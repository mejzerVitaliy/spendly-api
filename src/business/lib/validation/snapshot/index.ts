import { Currency } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const dailySnapshotBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string(),

  // Балансы
  openingBalance: z.number(),
  closingBalance: z.number(),
  currency: z.nativeEnum(Currency),

  // Движения за день
  totalIncome: z.number(),
  totalExpense: z.number(),
  netChange: z.number(),

  // Количество транзакций
  incomeCount: z.number(),
  expenseCount: z.number(),

  // Timestamps
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const dailySnapshotPublicSchema = dailySnapshotBaseSchema.pick({
  date: true,
  openingBalance: true,
  closingBalance: true,
  currency: true,
  totalIncome: true,
  totalExpense: true,
  netChange: true,
  incomeCount: true,
  expenseCount: true,
});

export const getBalanceHistoryQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in format YYYY-MM-DD',
  }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in format YYYY-MM-DD',
  }),
});

export const getSnapshotByDateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in format YYYY-MM-DD',
  }),
});

export const getBalanceHistoryResponseSchema = createResponseWithDataSchema(
  z.array(dailySnapshotPublicSchema),
);

export const getSnapshotByDateResponseSchema = createResponseWithDataSchema(
  dailySnapshotPublicSchema,
);

export const periodStatisticsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),

  // Балансы
  startingBalance: z.number(),
  endingBalance: z.number(),
  balanceChange: z.number(),
  currency: z.nativeEnum(Currency),

  // Суммарные движения
  totalIncome: z.number(),
  totalExpense: z.number(),
  netChange: z.number(),

  // Средние значения
  avgDailyIncome: z.number(),
  avgDailyExpense: z.number(),

  // Количество транзакций
  totalIncomeCount: z.number(),
  totalExpenseCount: z.number(),

  // Лучший/худший день
  bestDay: z
    .object({
      date: z.string(),
      netChange: z.number(),
    })
    .optional(),
  worstDay: z
    .object({
      date: z.string(),
      netChange: z.number(),
    })
    .optional(),
});

export const getPeriodStatisticsResponseSchema = createResponseWithDataSchema(
  periodStatisticsSchema,
);

export type DailySnapshot = z.infer<typeof dailySnapshotBaseSchema>;
export type DailySnapshotPublic = z.infer<typeof dailySnapshotPublicSchema>;

// Input типы для запросов
export type GetBalanceHistoryQuery = z.infer<
  typeof getBalanceHistoryQuerySchema
>;
export type GetSnapshotByDateQuery = z.infer<
  typeof getSnapshotByDateQuerySchema
>;

// Response типы
export type GetBalanceHistoryResponse = z.infer<
  typeof getBalanceHistoryResponseSchema
>;
export type GetSnapshotByDateResponse = z.infer<
  typeof getSnapshotByDateResponseSchema
>;
export type PeriodStatistics = z.infer<typeof periodStatisticsSchema>;
export type GetPeriodStatisticsResponse = z.infer<
  typeof getPeriodStatisticsResponseSchema
>;

export interface CreateSnapshotData {
  userId: string;
  date: Date;
  openingBalance: number;
  closingBalance: number;
  currency: Currency;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  incomeCount: number;
  expenseCount: number;
}

export interface UpdateSnapshotData {
  openingBalance?: number;
  closingBalance?: number;
  totalIncome?: number;
  totalExpense?: number;
  netChange?: number;
  incomeCount?: number;
  expenseCount?: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SnapshotFilters extends DateRange {
  userId: string;
}
