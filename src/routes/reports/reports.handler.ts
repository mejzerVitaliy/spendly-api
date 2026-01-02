import { GetReportsSummaryQuery } from '@/business/lib';
import { reportsService } from '@/business/services/reports';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';

const getSummary = async (
  req: FastifyRequest<{
    Querystring: GetReportsSummaryQuery;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate } = req.query;

  const summary = await reportsService.getSummary(userId, startDate, endDate);

  const response = {
    message: 'Reports summary fetched successfully',
    data: summary,
  };

  reply.send(response);
};

export const reportsHandler = {
  getSummary,
};
