import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        },
    }),

    // Plugins
    plugins: [
        expo({
            disableOriginOverride: true, // Fixes "Missing or null Origin" error for mobile apps
        }),
    ],

    // Email and Password authentication
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Disabled as per your request
    },

    // Google OAuth
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },

    // Session configuration with JWT (stateless-like with cookie cache)
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            strategy: "jwt",
        },
    },

    // User configuration - additional fields
    user: {
        additionalFields: {
            avatar: {
                type: "string",
                required: false,
                fieldName: "image", // Maps to 'image' column in DB
            },
        },
    },

    // Rate limiting
    rateLimit: {
        enabled: true,
        window: 60, // 60 seconds
        max: 100, // 100 requests per window
    },

    // Advanced options - Fix for OAuth state mismatch in development
    advanced: {
        disableOriginCheck: true, // TODO: Re-enable origin check once mobile auth is working
        crossSubDomainCookies: {
            enabled: false, // Disable for localhost development
        },
        defaultCookieAttributes: {
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production", // Secure in production with HTTPS
            httpOnly: true,
        },
    },

    // Account configuration for OAuth state handling
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
        },
    },

    // Trusted origins for CORS and mobile apps
    trustedOrigins: (request) => {
        const origin = request?.headers?.get?.("origin");

        const allowedOrigins = [
            // Allow null/missing origin (React Native / mobile apps)
            null,
            undefined,
            "",
            // Production
            "https://backend.fold.taohq.org",
            process.env.FRONTEND_URL || "http://localhost:3001",
            // Development
            "http://localhost:3000",
            "http://localhost:8081",
            // Mobile app deep links
            "fold://",
            // Expo development
            "exp://**",
            "exp://192.168.*.*:*/**",
            "exp://",
        ];

        // If no origin, allow it (mobile apps)
        if (!origin) return allowedOrigins;

        // Add the actual origin if it matches patterns
        if (origin.startsWith("fold://") || origin.startsWith("exp://")) {
            return [...allowedOrigins, origin];
        }

        return allowedOrigins;
    },
});
