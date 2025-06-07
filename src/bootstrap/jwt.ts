import { FastifyInstance, FastifyRequest } from 'fastify';
import { environmentVariables } from '@/config';
import fastifyJwt from '@fastify/jwt';
import { UnauthorizedError } from '@/business';

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
    } catch (err) {
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
