import { prisma } from '../prisma/prisma'
import { TransactionType } from '@prisma/client'

async function main() {
  const defaultCategories = [
    { name: 'Food', type: TransactionType.EXPENSE },
    { name: 'Apartments', type: TransactionType.EXPENSE },
    { name: 'Transport', type: TransactionType.EXPENSE },
    { name: 'Health', type: TransactionType.EXPENSE },
    { name: 'Subscriptions', type: TransactionType.EXPENSE },
    { name: 'Clothing', type: TransactionType.EXPENSE },
    { name: 'Travel', type: TransactionType.EXPENSE },
    { name: 'Sports', type: TransactionType.EXPENSE },
    { name: 'Education', type: TransactionType.EXPENSE },
    { name: 'Home & Living', type: TransactionType.EXPENSE },
    { name: 'Entertainment', type: TransactionType.EXPENSE },
    { name: 'Gifts', type: TransactionType.EXPENSE },
    { name: 'Pets', type: TransactionType.EXPENSE },
    
    { name: 'Salary', type: TransactionType.INCOME },
    { name: 'Gifts', type: TransactionType.INCOME },
    { name: 'Freelance', type: TransactionType.INCOME },
    { name: 'Investments', type: TransactionType.INCOME },
    { name: 'Grant', type: TransactionType.INCOME },
    { name: 'Rental Income', type: TransactionType.INCOME },
    { name: 'Bonuses', type: TransactionType.INCOME },
    { name: 'Sales', type: TransactionType.INCOME },
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

