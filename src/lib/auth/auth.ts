import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { PrismaClient } from '../../generated/prisma/client.js';

export const authOptions = (prisma: PrismaClient): BetterAuthOptions => ({
  basePath: '/api/auth',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: ({ user, url }) => {
      console.log(
        JSON.stringify({ type: 'password-reset', email: user.email, url }),
      );
      return Promise.resolve();
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'PARTICIPANT',
        input: false,
      },
    },
  },
});

export const createAuth = (prisma: PrismaClient) =>
  betterAuth(authOptions(prisma));

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
