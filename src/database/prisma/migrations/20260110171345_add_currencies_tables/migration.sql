/*
  Warnings:

  - You are about to drop the column `currency_code` on the `daily_balance_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `currency_code` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `main_currency_code` on the `users` table. All the data in the column will be lost.
  - Added the required column `currency` to the `daily_balance_snapshots` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CurrencyEnum" AS ENUM ('AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD', 'SSP', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMW', 'ZWL');

-- DropForeignKey
ALTER TABLE "daily_balance_snapshots" DROP CONSTRAINT "daily_balance_snapshots_currency_code_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_currency_code_fkey";

-- DropForeignKey
ALTER TABLE "user_favorite_currencies" DROP CONSTRAINT "user_favorite_currencies_currency_code_fkey";

-- DropForeignKey
ALTER TABLE "user_favorite_currencies" DROP CONSTRAINT "user_favorite_currencies_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_main_currency_code_fkey";

-- AlterTable
ALTER TABLE "daily_balance_snapshots" DROP COLUMN "currency_code",
ADD COLUMN     "currency" "CurrencyEnum" NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "currency_code",
ADD COLUMN     "currency" "CurrencyEnum" NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "main_currency_code",
ADD COLUMN     "mainCurrency" "CurrencyEnum" NOT NULL DEFAULT 'USD';
