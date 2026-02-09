import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env first, then override/supplement with .env.local
config();
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});