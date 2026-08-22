/// <reference types="./types/index.d.ts" />

import { File } from 'node:buffer';
if (!globalThis.File) {
  (globalThis as any).File = File;
}

import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import * as fastifyTypeProviderZod from 'fastify-type-provider-zod';
import { environmentVariables } from './config';
import { prisma, Prisma } from './database/prisma/prisma';
import { configureRoutes } from './routes';
import { configureJwt, configureMultipart } from './bootstrap';
import { startRecurringCron } from './business/services/cron/recurring.cron';

async function main() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'SYS:standard',
          colorize: true,
        },
      },
    },
  });

  await fastify.register(fastifyCors, {
    origin:
      environmentVariables.NODE_ENV === 'production'
        ? environmentVariables.ALLOWED_ORIGINS
        : true,
    credentials: true,
  });

  await fastify.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  });

  fastify.setValidatorCompiler(fastifyTypeProviderZod.validatorCompiler);
  fastify.setSerializerCompiler(fastifyTypeProviderZod.serializerCompiler);

  // Everything else (our own @fastify/error-based errors, Zod validation
  // errors, etc.) already carries a correct statusCode and is handled fine
  // by Fastify's default error handler - only translate the specific raw
  // Prisma error that otherwise leaks through as an opaque 500.
  fastify.setErrorHandler((error, _request, reply) => {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Resource not found',
      });
      return;
    }

    reply.send(error);
  });

  await configureJwt(fastify);
  await configureMultipart(fastify);
  await configureRoutes(fastify);

  try {
    fastify.log.info('Starting Fastify server...');

    await fastify.listen({
      port: environmentVariables.PORT,
      host: environmentVariables.HOST,
    });

    fastify.log.info('Server is started successfully');

    startRecurringCron({
      info: (msg) => fastify.log.info(msg),
      error: (msg, err) => fastify.log.error({ err }, msg),
    });
  } catch (error) {
    fastify.log.error('Failed to start server');
    fastify.log.error(error);

    process.exit(1);
  }

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, closing server`);

      await prisma.$disconnect();
      await fastify.close();
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
