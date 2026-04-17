const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lastProduct = await prisma.product.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { images: true }
  });
  console.log(JSON.stringify(lastProduct, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
