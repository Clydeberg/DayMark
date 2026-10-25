import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const passwordHash = await hash("Demo123!", 12);

  await db.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@example.com",
      passwordHash,
    },
  });

  await db.user.upsert({
    where: { email: "alex@example.com" },
    update: {},
    create: {
      name: "Alex Morgan",
      email: "alex@example.com",
      passwordHash,
    },
  });
}

main()
  .then(() => console.log("Demo users created."))
  .finally(() => db.$disconnect());
