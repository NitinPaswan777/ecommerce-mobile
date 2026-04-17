import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({ where: { name: 'Silky Draped Top' } });
  console.log('--- PRODUCT DATA ---');
  console.log(JSON.stringify(p, null, 2));
}
main();
