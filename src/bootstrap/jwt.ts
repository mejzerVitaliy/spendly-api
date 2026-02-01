import { FastifyInstance, FastifyRequest } from 'fastify';
import { environmentVariables } from '@/config';
import fastifyJwt from '@fastify/jwt';
import { UnauthorizedError } from '@/business';
import { userRepository } from '@/database/repositories';

export const configureJwt = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyJwt, {
    secret: environmentVariables.APPLICATION_SECRET,
    sign: {
      expiresIn: '15m', // Access token expiration
    },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();

      const { userId } = request.user as { userId: string };

      const user = await userRepository.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedError('User not found. Please login again.');
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      if ((err as Error).name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      }
      if ((err as Error).name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Authentication failed');
    }
  });
};
