import { FastifyInstance } from 'fastify';
import { applicationRoutes } from './app';
import { authRoutes } from './auth';
import { transactionRoutes } from './transaction';

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
};

export { configureRoutes };
