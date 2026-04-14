import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({
    include: { category: true, colors: true, sizes: true }
  });
  console.log(JSON.stringify(products, null, 2));
}
main();
