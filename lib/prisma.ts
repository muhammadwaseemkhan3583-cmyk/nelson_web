import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";

if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
  neonConfig.fetchConnectionCache = true;
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrismaClient = () => {
  const connectionString = `${process.env.DATABASE_URL}`;


  if (!connectionString) {
    throw new Error("DATABASE_URL missing");
  }

  const adapter = new PrismaNeon({
    connectionString: connectionString
      .trim()
      .replace(/^['"](.*)['"]$/, "$1"),
  });

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
};

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
