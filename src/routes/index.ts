import { FastifyInstance } from "fastify";
import { applicationRoutes } from "./app";
import { authRoutes } from "./auth";
import { transactionsRoutes } from "./transactions";
import { categoryRoutes } from "./categories";

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

  await fastify.register(categoryRoutes, {
    prefix: "api/categories",
  })
}

export { configureRoutes };