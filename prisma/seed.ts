import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
// import { createId } from '@paralleldrive/cuid2';

const prismaClientSingleton = () => {
  const pool = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter: pool });
};
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

async function main() {

}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  }).finally(async () => {
    await prisma.$disconnect();
  });
