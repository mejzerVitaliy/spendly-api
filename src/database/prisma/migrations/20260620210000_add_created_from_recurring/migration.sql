ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "created_from_recurring" BOOLEAN NOT NULL DEFAULT false;
