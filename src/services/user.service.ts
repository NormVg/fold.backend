import { prisma } from "../config/database.js";
import { comparePassword } from "../utils/password.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  UpdateProfileInput,
  UpdatePreferencesInput,
  UpdateEmailInput,
} from "../validators/schemas.js";

// User data returned (excludes sensitive info)
const userSelectFields = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  theme: true,
  status: true,
  authProvider: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export type UserData = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  theme: string | null;
  status: string;
  authProvider: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelectFields,
  });

  return user;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserData | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: userSelectFields,
  });

  return user;
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<UserData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.status !== "active") {
    throw new AppError(`Account is ${user.status}`, 403);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name ?? user.name,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.avatarUrl,
    },
    select: userSelectFields,
  });

  return updatedUser;
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  userId: string,
  data: UpdatePreferencesInput
): Promise<UserData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      theme: data.theme ?? user.theme,
    },
    select: userSelectFields,
  });

  return updatedUser;
}

/**
 * Update user email
 */
export async function updateEmail(userId: string, data: UpdateEmailInput): Promise<UserData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...userSelectFields, passwordHash: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.passwordHash) {
    throw new AppError("Account uses social login. Cannot change email.", 400);
  }

  // Verify password
  const isValidPassword = await comparePassword(data.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError("Invalid password", 401);
  }

  // Check if new email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email: data.newEmail },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { email: data.newEmail },
    select: userSelectFields,
  });

  return updatedUser;
}

/**
 * Soft delete user account (sets status to 'deleted')
 */
export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, authProvider: true, status: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // For local auth, verify password
  if (user.passwordHash) {
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError("Invalid password", 401);
    }
  }

  // Soft delete - change status to deleted
  await prisma.user.update({
    where: { id: userId },
    data: { status: "deleted" },
  });

  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Permanently delete user account (hard delete)
 */
export async function permanentlyDeleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Delete refresh tokens first (cascade should handle this, but being explicit)
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  // Delete user
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Suspend user account
 */
export async function suspendAccount(userId: string, _reason?: string): Promise<UserData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: "suspended" },
    select: userSelectFields,
  });

  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  });

  return updatedUser;
}

/**
 * Reactivate user account
 */
export async function reactivateAccount(userId: string): Promise<UserData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.status === "deleted") {
    throw new AppError("Cannot reactivate deleted account", 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: "active" },
    select: userSelectFields,
  });

  return updatedUser;
}

/**
 * Check if email is available
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return !user;
}

/**
 * Get user statistics (for admin or own profile)
 */
export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: { refreshTokens: true },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const activeSessions = await prisma.refreshToken.count({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  return {
    memberSince: user.createdAt,
    lastLogin: user.lastLoginAt,
    totalSessions: user._count.refreshTokens,
    activeSessions,
  };
}
