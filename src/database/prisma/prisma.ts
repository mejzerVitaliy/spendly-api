import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/** A regular PrismaClient or the `tx` handed to a `prisma.$transaction(async (tx) => ...)` callback. */
export type DbClient = PrismaClient | Prisma.TransactionClient;

const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

export { disconnectPrisma, prisma, Prisma };
