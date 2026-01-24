/*
  Warnings:

  - You are about to drop the column `currency` on the `daily_balance_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `mainCurrency` on the `users` table. All the data in the column will be lost.
  - Added the required column `currency_code` to the `daily_balance_snapshots` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "daily_balance_snapshots" DROP COLUMN "currency",
ADD COLUMN     "currency_code" VARCHAR(3) NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "currency",
ADD COLUMN     "currency_code" VARCHAR(3) NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "mainCurrency",
ADD COLUMN     "main_currency_code" VARCHAR(3) NOT NULL DEFAULT 'USD';

-- DropEnum
DROP TYPE "CurrencyEnum";

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_main_currency_code_fkey" FOREIGN KEY ("main_currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_balance_snapshots" ADD CONSTRAINT "daily_balance_snapshots_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_currencies" ADD CONSTRAINT "user_favorite_currencies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_currencies" ADD CONSTRAINT "user_favorite_currencies_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE CASCADE ON UPDATE CASCADE;
