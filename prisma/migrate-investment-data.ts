/**
 * Data migration: set investmentSubtype on categories and migrate legacy Investments
 * Run with: npx tsx prisma/migrate-investment-data.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Set investmentSubtype on existing investment categories
  const investmentCategories = await prisma.category.findMany({
    where: { type: 'investment' },
  })

  for (const cat of investmentCategories) {
    const subtype = cat.name.toLowerCase().includes('reserva') ? 'reserva' : 'carteira'
    await prisma.category.update({
      where: { id: cat.id },
      data: { investmentSubtype: subtype },
    })
  }

  // 2. Migrate existing Investments: copy categoryId to reserveCategoryId and walletCategoryId
  const investments = await prisma.investment.findMany({
    where: { categoryId: { not: null } },
  })

  for (const inv of investments) {
    if (inv.categoryId) {
      await prisma.investment.update({
        where: { id: inv.id },
        data: {
          reserveCategoryId: inv.categoryId,
          walletCategoryId: inv.categoryId,
        },
      })
    }
  }

  console.log('Migration complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
