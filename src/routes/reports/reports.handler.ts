import {
  AiInsightsQuery,
  CategoryChartQuery,
  SummaryQuery,
} from '@/business/lib';
import { reportsService } from '@/business/services/reports';
import { usageService } from '@/business/services/usage/usage.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';

const getSummary = async (
  req: FastifyRequest<{
    Querystring: SummaryQuery;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate, walletId } = req.query;

  const summary = await reportsService.getSummary(
    userId,
    startDate,
    endDate,
    walletId,
  );

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
  const { startDate, endDate, type, language, walletId } = req.query;

  const data = await reportsService.getCategoryChart(
    userId,
    startDate,
    endDate,
    type,
    language,
    walletId,
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
  const { startDate, endDate, walletId } = req.query;

  const data = await reportsService.getCashFlowTrend(
    userId,
    startDate,
    endDate,
    walletId,
  );

  reply.send({ message: 'Cash flow trend fetched successfully', data });
};

const getAiInsights = async (
  req: FastifyRequest<{ Querystring: AiInsightsQuery }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate, language, walletId } = req.query;

  await usageService.checkInsightLimit(userId);
  const data = await reportsService.getAiInsights(
    userId,
    startDate,
    endDate,
    language,
    walletId,
  );
  await usageService.incrementInsight(userId);
  reply.send({ message: 'AI insights generated', data });
};

export const reportsHandler = {
  getSummary,
  getCategoryChart,
  getCashFlowTrend,
  getAiInsights,
};
