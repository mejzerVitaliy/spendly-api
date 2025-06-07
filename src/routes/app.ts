import { FastifyInstance } from 'fastify';

const applicationRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/ping', async () => {
    return 'pong';
  });
};

export { applicationRoutes };
