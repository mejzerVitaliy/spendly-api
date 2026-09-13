-- AlterTable
ALTER TABLE "users" ADD COLUMN     "default_currency_code" VARCHAR(3),
ADD COLUMN     "default_expense_category_id" UUID,
ADD COLUMN     "default_income_category_id" UUID;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_default_income_category_id_fkey" FOREIGN KEY ("default_income_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_default_expense_category_id_fkey" FOREIGN KEY ("default_expense_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_default_currency_code_fkey" FOREIGN KEY ("default_currency_code") REFERENCES "currencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;
