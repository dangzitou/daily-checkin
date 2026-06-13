import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  
  if (!username) {
    console.error('Usage: ts-node set-admin.ts <username>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.error(`User "${username}" not found`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isAdmin: true },
  });

  console.log(`✅ User "${username}" is now an admin`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
