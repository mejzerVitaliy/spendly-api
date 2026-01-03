import { FastifyInstance } from 'fastify';
import { reportsHandler } from './reports.handler';
import {
  getBalanceTrendChartResponseSchema,
  getCategoryBarChartResponseSchema,
  getCategoryChartQuerySchema,
  getCategoryPieChartResponseSchema,
  getIncomesExpensesTrendChartResponseSchema,
  getReportsSummaryQuerySchema,
  getReportsSummaryResponseSchema,
} from '@/business/lib';

export const reportsRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/summary',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['reports'],
        summary: 'Get reports summary',
        querystring: getReportsSummaryQuerySchema,
        response: {
          200: getReportsSummaryResponseSchema,
        },
      },
    },
    reportsHandler.getSummary,
  );

  fastify.get(
    '/categories/bar-chart',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['reports'],
        summary: 'Get expenses by category for bar chart',
        querystring: getCategoryChartQuerySchema,
        response: {
          200: getCategoryBarChartResponseSchema,
        },
      },
    },
    reportsHandler.getCategoryBarChartData,
  );

  fastify.get(
    '/categories/pie-chart',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['reports'],
        summary: 'Get expenses pie chart data with colors',
        querystring: getCategoryChartQuerySchema,
        response: {
          200: getCategoryPieChartResponseSchema,
        },
      },
    },
    reportsHandler.getCategoryPieChartData,
  );

  fastify.get(
    '/incomes-expenses-trend',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['reports'],
        summary: 'Get incomes and expenses trend line chart data',
        querystring: getCategoryChartQuerySchema,
        response: {
          200: getIncomesExpensesTrendChartResponseSchema,
        },
      },
    },
    reportsHandler.getIncomesExpensesTrend,
  );

  fastify.get(
    '/balance-trend',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['reports'],
        summary: 'Get balance trend line chart data',
        querystring: getCategoryChartQuerySchema,
        response: {
          200: getBalanceTrendChartResponseSchema,
        },
      },
    },
    reportsHandler.getBalanceTrend,
  );
};
