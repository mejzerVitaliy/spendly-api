import { FastifyInstance } from "fastify";
import { applicationRoutes } from "./app";
import { authRoutes } from "./auth";

const configureRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(applicationRoutes, {
    prefix: "api",
  });

  await fastify.register(authRoutes, {
    prefix: "api/auth",
  })
}

export { configureRoutes };