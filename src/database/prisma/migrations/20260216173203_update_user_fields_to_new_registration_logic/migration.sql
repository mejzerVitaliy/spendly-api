-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('GUEST', 'REGISTERED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "UserType" NOT NULL DEFAULT 'GUEST',
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "firstName" SET DEFAULT '',
ALTER COLUMN "lastName" SET DEFAULT '',
ALTER COLUMN "password" DROP NOT NULL;
