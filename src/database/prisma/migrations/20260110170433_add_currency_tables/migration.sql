/*
  Warnings:

  - You are about to drop the column `currency` on the `daily_balance_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `mainCurrency` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "daily_balance_snapshots" DROP COLUMN "currency",
ADD COLUMN     "currency_code" VARCHAR(3) NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "currency",
ADD COLUMN     "currency_code" VARCHAR(3) NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "mainCurrency",
ADD COLUMN     "main_currency_code" VARCHAR(3) NOT NULL DEFAULT 'USD';

-- DropEnum
DROP TYPE "Currency";

-- CreateTable
CREATE TABLE "currencies" (
    "code" VARCHAR(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "user_favorite_currencies" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_currencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_favorite_currencies_user_id_idx" ON "user_favorite_currencies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_currencies_user_id_currency_code_key" ON "user_favorite_currencies"("user_id", "currency_code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_main_currency_code_fkey" FOREIGN KEY ("main_currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_currencies" ADD CONSTRAINT "user_favorite_currencies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_currencies" ADD CONSTRAINT "user_favorite_currencies_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_balance_snapshots" ADD CONSTRAINT "daily_balance_snapshots_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
