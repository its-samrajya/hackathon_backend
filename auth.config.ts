import { betterAuth } from 'better-auth';
import { authOptions } from './src/lib/auth/auth.js';
import type { PrismaClient } from './src/generated/prisma/client.js';

const prisma = {} as PrismaClient;

export const auth = betterAuth(authOptions(prisma));
