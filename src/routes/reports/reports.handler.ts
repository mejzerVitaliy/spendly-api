import { CategoryChartQuery, SummaryQuery } from '@/business/lib';
import { reportsService } from '@/business/services/reports';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';

const getSummary = async (
  req: FastifyRequest<{
    Querystring: SummaryQuery;
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

const getCategoryChart = async (
  req: FastifyRequest<{
    Querystring: CategoryChartQuery;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate, type } = req.query;

  const data = await reportsService.getCategoryChart(
    userId,
    startDate,
    endDate,
    type,
  );

  reply.send({ message: 'Category chart fetched successfully', data });
};

const getCashFlowTrend = async (
  req: FastifyRequest<{
    Querystring: CategoryChartQuery;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate } = req.query;

  const data = await reportsService.getCashFlowTrend(
    userId,
    startDate,
    endDate,
  );

  reply.send({ message: 'Cash flow trend fetched successfully', data });
};

export const reportsHandler = {
  getSummary,
  getCategoryChart,
  getCashFlowTrend,
};
