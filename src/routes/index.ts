import { FastifyInstance } from 'fastify';
import { applicationRoutes } from './app';
import { authRoutes } from './auth';
import { transactionRoutes } from './transaction';
import { reportsRoutes } from './reports';
import { currencyRoute } from './currency';
import { categoryRoute } from './category';
import { walletRoutes } from './wallet';

const configureRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(applicationRoutes, {
    prefix: 'api',
  });

  await fastify.register(authRoutes, {
    prefix: 'api/auth',
  });

  await fastify.register(transactionRoutes, {
    prefix: 'api/transaction',
  });

  await fastify.register(reportsRoutes, {
    prefix: 'api/reports',
  });

  await fastify.register(currencyRoute, {
    prefix: 'api/currency',
  });

  await fastify.register(categoryRoute, {
    prefix: 'api/category',
  });

  await fastify.register(walletRoutes, {
    prefix: 'api/wallet',
  });
};

export { configureRoutes };
