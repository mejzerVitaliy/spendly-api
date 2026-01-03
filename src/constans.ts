import { Category } from '@prisma/client';

const COLOR_BY_CATEGORY = {
  [Category.FOOD]: '#ff9b28ff',
  [Category.GIFT]: '#12ffebff',
  [Category.INVESTMENT]: '#ac303cff',
  [Category.SALARY]: '#3fff19ff',
  [Category.TRANSPORT]: '#d9ff04ff',
  [Category.HOUSING]: '#a51dffff',
  [Category.UTILITIES]: '#205d5fff',
  [Category.HEALTH]: '#ffccd1ff',
  [Category.HOBBY]: '#1129ffff',
  [Category.OTHER]: '#ff11f3ff',
};

export { COLOR_BY_CATEGORY };
