-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'UA', 'RU');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'EN',
ADD COLUMN     "mainCurrency" "Currency" NOT NULL DEFAULT 'USD';
