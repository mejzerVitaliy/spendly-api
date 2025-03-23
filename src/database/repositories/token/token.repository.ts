import { Prisma, prisma } from '../../../database/prisma/prisma';

const create = <T extends Prisma.TokenCreateArgs>(
  args: Prisma.SelectSubset<T, Prisma.TokenCreateArgs>
) => prisma.token.create(args);

const findFirst = <T extends Prisma.TokenFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.TokenFindFirstArgs>
) => prisma.token.findFirst(args);

const findUnique = <T extends Prisma.TokenFindUniqueArgs>(
  args: Prisma.SelectSubset<T, Prisma.TokenFindUniqueArgs>
) => prisma.token.findUnique(args);

const update = <T extends Prisma.TokenUpdateArgs>(
  args: Prisma.SelectSubset<T, Prisma.TokenUpdateArgs>
) => prisma.token.update(args);

const deleteOne = <T extends Prisma.TokenDeleteArgs>(
  args: Prisma.SelectSubset<T, Prisma.TokenDeleteArgs>
) => prisma.token.delete(args);

const deleteMany = <T extends Prisma.TokenDeleteManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.TokenDeleteManyArgs>
) => prisma.token.deleteMany(args);

export const tokenRepository = {
  create,
  findFirst,
  findUnique,
  update,
  delete: deleteOne,
  deleteMany,
};