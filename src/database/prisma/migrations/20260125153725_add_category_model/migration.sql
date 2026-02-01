/*
  Warnings:

  - You are about to drop the column `category` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- Insert default categories
INSERT INTO "categories" ("id", "name", "color", "type", "order") VALUES
  (gen_random_uuid(), 'Salary', '#16A34A', 'INCOME', 1),
  (gen_random_uuid(), 'Freelance', '#4ADE80', 'INCOME', 2),
  (gen_random_uuid(), 'Bonus', '#22C55E', 'INCOME', 3),
  (gen_random_uuid(), 'Side Hustle', '#10B981', 'INCOME', 4),
  (gen_random_uuid(), 'Investments', '#0EA5E9', 'INCOME', 5),
  (gen_random_uuid(), 'Dividends', '#0284C7', 'INCOME', 6),
  (gen_random_uuid(), 'Interest', '#0369A1', 'INCOME', 7),
  (gen_random_uuid(), 'Refunds', '#8B5CF6', 'INCOME', 8),
  (gen_random_uuid(), 'Gifts Received', '#EC4899', 'INCOME', 9),
  (gen_random_uuid(), 'Food', '#22C55E', 'EXPENSE', 10),
  (gen_random_uuid(), 'Rent', '#EF4444', 'EXPENSE', 11),
  (gen_random_uuid(), 'Utilities', '#F97316', 'EXPENSE', 12),
  (gen_random_uuid(), 'Transportation', '#14B8A6', 'EXPENSE', 13),
  (gen_random_uuid(), 'Public Transport', '#0F766E', 'EXPENSE', 14),
  (gen_random_uuid(), 'Taxi / Ride Sharing', '#2DD4BF', 'EXPENSE', 15),
  (gen_random_uuid(), 'Car Maintenance', '#7C2D12', 'EXPENSE', 16),
  (gen_random_uuid(), 'Parking', '#9CA3AF', 'EXPENSE', 17),
  (gen_random_uuid(), 'Doctor / Medical', '#DB2777', 'EXPENSE', 18),
  (gen_random_uuid(), 'Pharmacy', '#EC4899', 'EXPENSE', 19),
  (gen_random_uuid(), 'Gym', '#7C3AED', 'EXPENSE', 20),
  (gen_random_uuid(), 'Clothing', '#8B5CF6', 'EXPENSE', 21),
  (gen_random_uuid(), 'Shoes', '#7C3AED', 'EXPENSE', 22),
  (gen_random_uuid(), 'Home Goods', '#3B82F6', 'EXPENSE', 23),
  (gen_random_uuid(), 'Gifts', '#F472B6', 'EXPENSE', 24),
  (gen_random_uuid(), 'Subscriptions', '#6366F1', 'EXPENSE', 25),
  (gen_random_uuid(), 'Software / Cloud Services', '#0284C7', 'EXPENSE', 26),
  (gen_random_uuid(), 'Education', '#14B8A6', 'EXPENSE', 27),
  (gen_random_uuid(), 'Online Courses', '#22D3EE', 'EXPENSE', 28),
  (gen_random_uuid(), 'Books', '#0D9488', 'EXPENSE', 29),
  (gen_random_uuid(), 'Entertainment', '#F472B6', 'EXPENSE', 30),
  (gen_random_uuid(), 'Travel', '#38BDF8', 'EXPENSE', 31),
  (gen_random_uuid(), 'Events', '#F0ABFC', 'EXPENSE', 32),
  (gen_random_uuid(), 'Taxes', '#991B1B', 'EXPENSE', 33),
  (gen_random_uuid(), 'Loan / Credit Payments', '#B91C1C', 'EXPENSE', 34),
  (gen_random_uuid(), 'Bank Fees', '#7F1D1D', 'EXPENSE', 35),
  (gen_random_uuid(), 'Pets', '#A855F7', 'EXPENSE', 36),
  (gen_random_uuid(), 'Charity', '#22C55E', 'EXPENSE', 37),
  (gen_random_uuid(), 'Unexpected Expenses', '#6B7280', 'EXPENSE', 38);

-- AlterTable: Add category_id column with temporary nullable
ALTER TABLE "transactions" ADD COLUMN "category_id" UUID;

-- Update existing transactions: map old category enum to new category IDs
-- Set to 'Food' category for EXPENSE transactions and 'Salary' for INCOME
UPDATE "transactions" 
SET "category_id" = (
  SELECT "id" FROM "categories" 
  WHERE "name" = CASE 
    WHEN "transactions"."type" = 'EXPENSE' THEN 'Food'
    ELSE 'Salary'
  END
  LIMIT 1
);

-- Make category_id NOT NULL
ALTER TABLE "transactions" ALTER COLUMN "category_id" SET NOT NULL;

-- Drop old category column
ALTER TABLE "transactions" DROP COLUMN "category";

-- DropEnum
DROP TYPE "Category";

-- CreateTable
CREATE TABLE "user_favorite_categories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_favorite_categories_user_id_idx" ON "user_favorite_categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_categories_user_id_category_id_key" ON "user_favorite_categories"("user_id", "category_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_categories" ADD CONSTRAINT "user_favorite_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_categories" ADD CONSTRAINT "user_favorite_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
