import { categoryRepository } from "@/database/repositories/categories/category.repository";

const getAll = async () => {
  const defaultCategories = await categoryRepository.findMany({
    where: {
      userId: null
    }
  });

  return defaultCategories;
}

export const categoriesService = {
  getAll
}