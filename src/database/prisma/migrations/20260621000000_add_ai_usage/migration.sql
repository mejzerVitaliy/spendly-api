CREATE TABLE "ai_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "transaction_count" INTEGER NOT NULL DEFAULT 0,
    "insight_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_usage_user_id_month_key" ON "ai_usage"("user_id", "month");
CREATE INDEX "ai_usage_user_id_idx" ON "ai_usage"("user_id");

ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
