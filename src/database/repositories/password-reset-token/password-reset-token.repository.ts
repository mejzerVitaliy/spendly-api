import { Prisma, prisma } from '../../../database/prisma/prisma';

const create = <T extends Prisma.PasswordResetTokenCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.PasswordResetTokenCreateArgs>,
) => prisma.passwordResetToken.create(args);

const findFirst = <T extends Prisma.PasswordResetTokenFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.PasswordResetTokenFindFirstArgs>,
) => prisma.passwordResetToken.findFirst(args);

const update = <T extends Prisma.PasswordResetTokenUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.PasswordResetTokenUpdateArgs>,
) => prisma.passwordResetToken.update(args);

const deleteMany = <T extends Prisma.PasswordResetTokenDeleteManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.PasswordResetTokenDeleteManyArgs>,
) => prisma.passwordResetToken.deleteMany(args);

export const passwordResetTokenRepository = {
  create,
  findFirst,
  update,
  deleteMany,
};
