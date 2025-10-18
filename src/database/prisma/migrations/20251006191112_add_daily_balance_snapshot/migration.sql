-- CreateTable
CREATE TABLE "daily_balance_snapshots" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "openingBalance" INTEGER NOT NULL,
    "closingBalance" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "totalIncome" INTEGER NOT NULL DEFAULT 0,
    "totalExpense" INTEGER NOT NULL DEFAULT 0,
    "netChange" INTEGER NOT NULL DEFAULT 0,
    "incomeCount" INTEGER NOT NULL DEFAULT 0,
    "expenseCount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_balance_snapshots_user_id_date_idx" ON "daily_balance_snapshots"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_balance_snapshots_user_id_date_key" ON "daily_balance_snapshots"("user_id", "date");

-- AddForeignKey
ALTER TABLE "daily_balance_snapshots" ADD CONSTRAINT "daily_balance_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
