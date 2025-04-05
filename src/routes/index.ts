import { FastifyInstance } from "fastify";
import { applicationRoutes } from "./app";
import { authRoutes } from "./auth";
import { transactionsRoutes } from "./transactions";

const configureRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(applicationRoutes, {
    prefix: "api",
  });

  await fastify.register(authRoutes, {
    prefix: "api/auth",
  })

  await fastify.register(transactionsRoutes, {
    prefix: "api/transactions",
  })
}

export { configureRoutes };