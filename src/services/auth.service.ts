import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateTokenPair, verifyRefreshToken, getExpirationDate } from "../utils/jwt.js";
import { AppError } from "../middleware/errorHandler.js";
import type { TokenPair, AuthProvider } from "../types/index.js";
import type {
  RegisterInput,
  LoginInput,
  GoogleAuthInput,
  ChangePasswordInput,
} from "../validators/schemas.js";

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    theme: string | null;
    status: string;
    authProvider: string | null;
    createdAt: Date;
  };
  tokens: TokenPair;
}

// User data returned after auth (excludes sensitive info)
const userSelectFields = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  theme: true,
  status: true,
  authProvider: true,
  createdAt: true,
};

/**
 * Register a new user with email and password
 */
export async function register(
  data: RegisterInput,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      authProvider: "local" as AuthProvider,
      status: "active",
    },
    select: userSelectFields,
  });

  // Generate tokens
  const tokens = generateTokenPair(user.id, user.email);

  // Store refresh token
  await storeRefreshToken(user.id, tokens.refreshToken, userAgent, ipAddress);

  return { user, tokens };
}

/**
 * Login with email and password
 */
export async function login(
  data: LoginInput,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      ...userSelectFields,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if user has a password (might be OAuth-only user)
  if (!user.passwordHash) {
    throw new AppError("Account uses social login. Please sign in with your provider.", 401);
  }

  // Verify password
  const isValidPassword = await comparePassword(data.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check account status
  if (user.status !== "active") {
    throw new AppError(`Account is ${user.status}`, 403);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const tokens = generateTokenPair(user.id, user.email);

  // Store refresh token
  await storeRefreshToken(user.id, tokens.refreshToken, userAgent, ipAddress);

  // Return user without passwordHash
  const userWithoutPassword = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    theme: user.theme,
    status: user.status,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
  };

  return { user: userWithoutPassword, tokens };
}

/**
 * Login or register with Google OAuth
 */
export async function googleAuth(
  _data: GoogleAuthInput,
  _userAgent?: string,
  _ipAddress?: string
): Promise<AuthResult> {
  // In a real application, you would verify the Google ID token here
  // For now, we'll decode it (not verify) - YOU MUST implement proper verification
  // using google-auth-library or similar

  // This is a placeholder - implement proper Google token verification
  // const { OAuth2Client } = require('google-auth-library');
  // const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  // const ticket = await client.verifyIdToken({
  //   idToken: data.idToken,
  //   audience: env.GOOGLE_CLIENT_ID,
  // });
  // const payload = ticket.getPayload();

  // For demonstration, we'll throw an error asking for implementation
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError("Google OAuth is not configured", 501);
  }

  // Placeholder - replace with actual Google token verification
  throw new AppError(
    "Google OAuth verification not implemented. Please add google-auth-library and implement token verification.",
    501
  );
}

/**
 * Refresh access token using refresh token
 */
export async function refreshTokens(
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<TokenPair> {
  // Verify the refresh token
  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Check if refresh token exists and is not revoked
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { select: { status: true } } },
  });

  if (!storedToken) {
    throw new AppError("Refresh token not found", 401);
  }

  if (storedToken.revokedAt) {
    // Token was revoked - possible token theft, revoke all tokens for user
    await revokeAllUserTokens(storedToken.userId);
    throw new AppError("Refresh token has been revoked", 401);
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError("Refresh token has expired", 401);
  }

  if (storedToken.user.status !== "active") {
    throw new AppError(`Account is ${storedToken.user.status}`, 403);
  }

  // Revoke the old refresh token (token rotation)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Generate new token pair
  const tokens = generateTokenPair(payload.userId, payload.email);

  // Store new refresh token
  await storeRefreshToken(payload.userId, tokens.refreshToken, userAgent, ipAddress);

  return tokens;
}

/**
 * Logout - revoke refresh token
 */
export async function logout(refreshToken: string): Promise<void> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (storedToken && !storedToken.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });
  }
}

/**
 * Logout from all devices - revoke all refresh tokens
 */
export async function logoutAll(userId: string): Promise<void> {
  await revokeAllUserTokens(userId);
}

/**
 * Change password
 */
export async function changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, authProvider: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.passwordHash) {
    throw new AppError("Account uses social login. Cannot change password.", 400);
  }

  // Verify current password
  const isValidPassword = await comparePassword(data.currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError("Current password is incorrect", 401);
  }

  // Hash new password
  const newPasswordHash = await hashPassword(data.newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  // Revoke all refresh tokens (force re-login)
  await revokeAllUserTokens(userId);
}

/**
 * Get active sessions for a user
 */
export async function getActiveSessions(userId: string) {
  const sessions = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions;
}

/**
 * Revoke a specific session
 */
export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const token = await prisma.refreshToken.findFirst({
    where: { id: sessionId, userId },
  });

  if (!token) {
    throw new AppError("Session not found", 404);
  }

  await prisma.refreshToken.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

// ============ Helper Functions ============

async function storeRefreshToken(
  userId: string,
  token: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: getExpirationDate(env.JWT_REFRESH_EXPIRES_IN),
      userAgent,
      ipAddress,
    },
  });

  // Cleanup old tokens (keep max 10 per user)
  const tokens = await prisma.refreshToken.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    skip: 10,
  });

  if (tokens.length > 0) {
    await prisma.refreshToken.deleteMany({
      where: { id: { in: tokens.map((t) => t.id) } },
    });
  }
}

async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
