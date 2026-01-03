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

const getCategoryBarChartData = async (
  req: FastifyRequest<{
    Querystring: CategoryChartQuery;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate, type } = req.query;

  const expenses = await reportsService.getCategoryBarChartData(
    userId,
    startDate,
    endDate,
    type,
  );

  const response = {
    message: 'Expenses by category fetched successfully',
    data: expenses,
  };

  reply.send(response);
};

const getCategoryPieChartData = async (
  req: FastifyRequest<{
    Querystring: CategoryChartQuery;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate, type } = req.query;

  const pieData = await reportsService.getCategoryPieChartData(
    userId,
    startDate,
    endDate,
    type,
  );

  const response = {
    message: 'Pie chart data fetched successfully',
    data: pieData,
  };

  reply.send(response);
};

const getIncomesExpensesTrend = async (
  req: FastifyRequest<{
    Querystring: CategoryChartQuery;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate } = req.query;

  const trendData = await reportsService.getIncomesExpensesTrend(
    userId,
    startDate,
    endDate,
  );

  const response = {
    message: 'Incomes and expenses trend data fetched successfully',
    data: trendData,
  };

  reply.send(response);
};

const getBalanceTrend = async (
  req: FastifyRequest<{
    Querystring: CategoryChartQuery;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate } = req.query;

  const balanceTrend = await reportsService.getBalanceTrend(
    userId,
    startDate,
    endDate,
  );

  const response = {
    message: 'Balance trend data fetched successfully',
    data: balanceTrend,
  };

  reply.send(response);
};

export const reportsHandler = {
  getSummary,
  getCategoryBarChartData,
  getCategoryPieChartData,
  getIncomesExpensesTrend,
  getBalanceTrend,
};
