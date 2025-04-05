import { prisma } from '../prisma/prisma'
import { TransactionType } from '@prisma/client'

async function main() {
  const defaultCategories = [
    { name: 'Food', icon: '🍔', type: TransactionType.EXPENSE },
    { name: 'Apartments', icon: '🏠', type: TransactionType.EXPENSE },
    { name: 'Transport', icon: '🚗', type: TransactionType.EXPENSE },
    { name: 'Salary', icon: '💰', type: TransactionType.INCOME },
    { name: 'Freelance', icon: '🖥️', type: TransactionType.INCOME },
    { name: 'Gift', icon: '🎁', type: TransactionType.INCOME },
    { name: 'Health', icon: '💊', type: TransactionType.EXPENSE },
  ]

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  console.log("✅ Default categories created!")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })

