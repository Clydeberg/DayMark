import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // A placeholder lets `prisma generate` and production builds run before
    // a real database is connected. Migrations still require DATABASE_URL.
    url:
      process.env.DATABASE_URL ??
      "postgresql://calendar:calendar@localhost:5432/calendar",
  },
});
