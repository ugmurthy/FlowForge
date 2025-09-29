import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Process exit handlers
process.on('beforeExit', () => {
  prisma.$disconnect();
});

process.on('SIGINT', () => {
  prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  prisma.$disconnect();
  process.exit(0);
});
