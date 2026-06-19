import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not configured. Set it in .env.local with your Supabase/Postgres connection string.'
    );
  }

  if (databaseUrl.includes('your-project-ref') || databaseUrl.includes('your-db-password')) {
    throw new Error(
      'DATABASE_URL contains placeholder values. Replace the placeholder host/password in .env.local with your actual Supabase/Postgres credentials.'
    );
  }

  return databaseUrl;
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
