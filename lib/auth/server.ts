/**
 * Better Auth Configuration for Mint AI
 * 
 * SERVER-SIDE ONLY configuration
 * This file should NOT be imported in client components
 */

import { betterAuth } from "better-auth";

/**
 * Better Auth instance configured for server-side use
 * Client components should use the API routes instead
 */
export const auth = betterAuth({
  // Server-side configuration without Convex adapter for now
  // We'll implement auth using API routes and Convex directly
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  advanced: {
    cookiePrefix: "mint-auth",
    crossSubDomainCookies: {
      enabled: false,
    },
    generateId: () => crypto.randomUUID(),
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["email", "github", "google"],
    },
  },

  security: {
    csrfProtection: true,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
