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

export const categoryBarChartItemSchema = z.object({
  value: z.number(),
  label: z.string(),
  frontColor: z.string(),
});

export const categoryBarChartSchema = z.object({
  data: z.array(categoryBarChartItemSchema),
  totalExpenses: z.number(),
  period: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
});

export const getCategoryBarChartResponseSchema = createResponseWithDataSchema(
  categoryBarChartSchema,
);

type CategoryBarChart = z.infer<typeof categoryBarChartSchema>;

export const pieChartItemSchema = z.object({
  value: z.number(),
  label: z.string(),
  color: z.string(),
  focused: z.boolean().optional(),
});

export const categoryPieChartSchema = z.object({
  data: z.array(pieChartItemSchema),
  totalExpenses: z.number(),
  period: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
});

export const getCategoryPieChartResponseSchema = createResponseWithDataSchema(
  categoryPieChartSchema,
);

type CategoryPieChart = z.infer<typeof categoryPieChartSchema>;

type CategoryChartQuery = z.infer<typeof getCategoryChartQuerySchema>;

export const lineChartItemSchema = z.object({
  value: z.number(),
  dataPointText: z.string().optional(),
  label: z.string(),
});

export const incomesExpensesTrendChartSchema = z.object({
  expenses: z.array(lineChartItemSchema),
  incomes: z.array(lineChartItemSchema),
  period: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
});

export const getIncomesExpensesTrendChartResponseSchema =
  createResponseWithDataSchema(incomesExpensesTrendChartSchema);

type IncomesExpensesTrendChart = z.infer<
  typeof incomesExpensesTrendChartSchema
>;

export const balanceTrendChartSchema = z.object({
  data: z.array(lineChartItemSchema),
  period: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
});

export const getBalanceTrendChartResponseSchema = createResponseWithDataSchema(
  balanceTrendChartSchema,
);

type BalanceTrendChart = z.infer<typeof balanceTrendChartSchema>;

export type {
  SummaryQuery,
  CategoryChartQuery,
  ReportsSummary,
  CategoryBarChart,
  CategoryPieChart,
  IncomesExpensesTrendChart,
  BalanceTrendChart,
};
