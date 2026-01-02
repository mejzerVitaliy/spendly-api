import { Currency } from '@prisma/client';
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

export const reportsSummarySchema = z.object({
  totalBalance: z.number(),
  currency: z.nativeEnum(Currency),
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

export type GetReportsSummaryQuery = z.infer<
  typeof getReportsSummaryQuerySchema
>;
export type ReportsSummary = z.infer<typeof reportsSummarySchema>;
export type GetReportsSummaryResponse = z.infer<
  typeof getReportsSummaryResponseSchema
>;
