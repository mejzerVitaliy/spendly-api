-- AddColumn: recurring transaction support
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "is_recurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "recurring_period" VARCHAR(20);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "next_recurring_date" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transactions_is_recurring_next_idx" ON "transactions"("is_recurring", "next_recurring_date");
