import { TransactionType } from '@prisma/client';
import { z } from 'zod';
import { createResponseWithDataSchema } from '../application';

export const getReportsSummaryQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'startDate must be in format YYYY-MM-DD',
    })
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'endDate must be in format YYYY-MM-DD',
    })
    .optional(),
});

type SummaryQuery = z.infer<typeof getReportsSummaryQuerySchema>;

export const reportsSummarySchema = z.object({
  totalBalance: z.number(),
  currencyCode: z.string().length(3),
  totalIncome: z.number(),
  totalExpense: z.number(),
  netChange: z.number(),
  incomeCount: z.number(),
  expenseCount: z.number(),
  totalTransactions: z.number(),
  period: z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    isAllTime: z.boolean(),
  }),
});

export const getReportsSummaryResponseSchema =
  createResponseWithDataSchema(reportsSummarySchema);

type ReportsSummary = z.infer<typeof reportsSummarySchema>;

export const getCategoryChartQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'startDate must be in format YYYY-MM-DD',
    })
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'endDate must be in format YYYY-MM-DD',
    })
    .optional(),
  type: z.nativeEnum(TransactionType).optional(),
});

export const categoryChartItemSchema = z.object({
  amount: z.number(),
  percentage: z.number(),
  label: z.string(),
  color: z.string(),
});

export const categoryChartSchema = z.object({
  data: z.array(categoryChartItemSchema),
  total: z.number(),
  currencyCode: z.string(),
  period: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
});

export const getCategoryChartResponseSchema =
  createResponseWithDataSchema(categoryChartSchema);

type CategoryChart = z.infer<typeof categoryChartSchema>;

type CategoryChartQuery = z.infer<typeof getCategoryChartQuerySchema>;

export const trendPointSchema = z.object({
  value: z.number(),
  date: z.string(),
  label: z.string(),
});

export const cashFlowTrendChartSchema = z.object({
  incomes: z.array(trendPointSchema),
  expenses: z.array(trendPointSchema),
  currencyCode: z.string(),
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

export const getCashFlowTrendChartResponseSchema = createResponseWithDataSchema(
  cashFlowTrendChartSchema,
);

type CashFlowTrendChart = z.infer<typeof cashFlowTrendChartSchema>;

export type {
  SummaryQuery,
  CategoryChartQuery,
  ReportsSummary,
  CategoryChart,
  CashFlowTrendChart,
};
