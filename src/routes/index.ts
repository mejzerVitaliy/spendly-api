import { FastifyInstance } from 'fastify';
import { applicationRoutes } from './app';
import { authRoutes } from './auth';
import { transactionRoutes } from './transaction';
import { profileRoutes } from './profile';
import { reportsRoutes } from './reports';

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

  await fastify.register(profileRoutes, {
    prefix: 'api/profile',
  });

  await fastify.register(reportsRoutes, {
    prefix: 'api/reports',
  });
};

export { configureRoutes };
