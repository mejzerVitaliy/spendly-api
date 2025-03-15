import { Prisma, prisma } from '../../../database/prisma/prisma';

const create = <T extends Prisma.UserCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserCreateArgs>
) => prisma.user.create(args);

const findMany = <T extends Prisma.UserFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>
) => prisma.user.findMany(args);

const findUnique = <T extends Prisma.UserFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>
) => prisma.user.findUnique(args);

const findFirst = <T extends Prisma.UserFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindFirstArgs>
) => prisma.user.findFirst(args);

const upsert = <T extends Prisma.UserUpsertArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserUpsertArgs>
) => prisma.user.upsert(args);

const update = <T extends Prisma.UserUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserUpdateArgs>
) => prisma.user.update(args);

const deleteOne = <T extends Prisma.UserDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserDeleteArgs>
) => prisma.user.delete(args);

export const userRepository = {
    create,
    findMany,
    findUnique,
    findFirst,
    upsert,
    update,
    delete: deleteOne,
};