import { FastifyInstance } from 'fastify';
import { reportsHandler } from './reports.handler';
import {
  getCategoryChartQuerySchema,
  getCategoryChartResponseSchema,
  getCashFlowTrendChartResponseSchema,
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
        response: { 200: getReportsSummaryResponseSchema },
      },
    },
    reportsHandler.getSummary,
  );

  fastify.get(
    '/categories',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['reports'],
        summary: 'Get category breakdown (income or expense)',
        querystring: getCategoryChartQuerySchema,
        response: { 200: getCategoryChartResponseSchema },
      },
    },
    reportsHandler.getCategoryChart,
  );

  fastify.get(
    '/cash-flow-trend',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['reports'],
        summary: 'Get cash flow trend (incomes vs expenses by day)',
        querystring: getCategoryChartQuerySchema,
        response: { 200: getCashFlowTrendChartResponseSchema },
      },
    },
    reportsHandler.getCashFlowTrend,
  );
};
