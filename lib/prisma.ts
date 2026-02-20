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

  const client = new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

  // Debug: Log available models to console once
  if (process.env.NODE_ENV !== "production") {
    const models = Object.keys(client).filter(key => !key.startsWith("_") && !key.startsWith("$"));
    console.log(">>> Prisma Models Available:", models);
  }

  return client;
};

// Triggering client reload for new models - Force Reload Flag: v2
const forceReload = true;
export const prisma = (process.env.NODE_ENV !== "production" && forceReload) 
  ? getPrismaClient() 
  : (globalForPrisma.prisma ?? getPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
