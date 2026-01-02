import { FastifyInstance } from 'fastify';
import { reportsHandler } from './reports.handler';
import {
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
};
