import { FastifyInstance } from "fastify";

export const authRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/login", async () => {
    return "login";
  });

  fastify.get("/register", async () => {
    return "register";
  });
}