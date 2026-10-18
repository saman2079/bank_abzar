import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js از .env.local می‌خواند؛ Prisma CLI هم باید همان را ببیند.
config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
