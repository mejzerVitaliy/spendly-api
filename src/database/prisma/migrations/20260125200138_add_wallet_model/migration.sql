-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'SAVINGS', 'CUSTOM');

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WalletType" NOT NULL DEFAULT 'CASH',
    "currency_code" VARCHAR(3) NOT NULL,
    "initial_balance" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallets_user_id_idx" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_name_key" ON "wallets"("user_id", "name");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default wallets for existing users who have transactions
INSERT INTO "wallets" ("id", "user_id", "name", "type", "currency_code", "initial_balance", "is_default", "is_archived", "created_at", "updated_at")
SELECT 
    gen_random_uuid(),
    u."id",
    'Main Wallet',
    'CASH'::"WalletType",
    COALESCE(u."main_currency_code", 'USD'),
    0,
    true,
    false,
    NOW(),
    NOW()
FROM "users" u
WHERE EXISTS (SELECT 1 FROM "transactions" t WHERE t."user_id" = u."id");

-- AlterTable: Add wallet_id as nullable first
ALTER TABLE "transactions" ADD COLUMN "wallet_id" UUID;

-- Update existing transactions with their user's default wallet
UPDATE "transactions" t
SET "wallet_id" = w."id"
FROM "wallets" w
WHERE t."user_id" = w."user_id" AND w."is_default" = true;

-- Make wallet_id NOT NULL
ALTER TABLE "transactions" ALTER COLUMN "wallet_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "transactions_wallet_id_idx" ON "transactions"("wallet_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
