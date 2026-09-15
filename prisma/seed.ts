// Promotes an existing user to ADMIN by email. Usage:
//   npm run db:seed -- someone@example.com
import { prisma } from "@/lib/db/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:seed -- <email>");
    process.exit(1);
  }

  const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN" } }).catch(() => null);
  if (!user) {
    console.error(`No user found with email ${email}. Register the account first, then re-run this script.`);
    process.exit(1);
  }

  console.log(`${user.email} is now an ADMIN.`);
}

main().finally(() => prisma.$disconnect());
