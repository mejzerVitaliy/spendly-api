/// <reference types="./types/index.d.ts" />

import Fastify from 'fastify'
import fastifyCors from 'fastify-cors';
import * as fastifyTypeProviderZod from 'fastify-type-provider-zod';
import { environmentVariables } from './config';
import { initPrismaProxy, prisma } from './database/prisma/prisma';
import { configureRoutes } from './routes';

async function main() {
    const fastify = Fastify({
        logger: {
            level: 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    translateTime: 'SYS:standard',
                    colorize: true
                }
            }
        }
    });

    await fastify.register(fastifyCors, {
        origin: true,
        credentials: true
    })

    fastify.setValidatorCompiler(fastifyTypeProviderZod.validatorCompiler)
    fastify.setSerializerCompiler(fastifyTypeProviderZod.serializerCompiler)

    await configureRoutes(fastify);

    try {
        await initPrismaProxy();

        fastify.log.info("Starting Fastify server...");

        fastify.listen({
            port: environmentVariables.PORT,
            host: environmentVariables.HOST
        })

        fastify.log.info('Server is started successfully');
    } catch (error) {
        fastify.log.error('Failed to start server')
        fastify.log.error(error)

        process.exit(1);
    }

    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
    signals.forEach(signal => {
        process.on(signal, async () => {
            fastify.log.info(`Received ${signal}, closing server`)

            await prisma.$disconnect();
            await fastify.close();
            process.exit(0);
        })
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
})