/// <reference types="./types/index.d.ts" />

import Fastify from 'fastify'
import fastifyCors from 'fastify-cors';
import * as fastifyTypeProviderZod from 'fastify-type-provider-zod';
import { initPrismaProxy, prisma } from './database/prisma/prisma';
import { environmentVariables } from './config';

async function main() {
    const fastify = Fastify();

    await fastify.register(fastifyCors, {
        origin: true,
        credentials: true
    })

    fastify.setValidatorCompiler(fastifyTypeProviderZod.validatorCompiler)
    fastify.setSerializerCompiler(fastifyTypeProviderZod.serializerCompiler)

    try {
        await initPrismaProxy();

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
            fastify.log.info(`Recived ${signal}, closing server`)

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