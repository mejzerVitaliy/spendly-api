import { PrismaClient, Prisma } from "@prisma/client";
import { Server } from "net";

let prisma = new PrismaClient()
let proxy: Server

const initPrismaProxy = async () => {
    console.log('Skipping Prisma initialization...')
}

const disconnectPrisma = async () => {
    await prisma.$disconnect()
    // proxy?.close()
}

export {initPrismaProxy, disconnectPrisma, prisma, Prisma}