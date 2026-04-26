/**
 * SufiPulse Authentication System
 * 
 * JWT-based authentication with:
 * - Password hashing (bcrypt)
 * - Access tokens (7 days)
 * - Refresh tokens (30 days)
 * - HTTP-only cookies
 * - Email verification (OTP)
 * - Password reset
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { generateId, db } from './database';
import type { User } from './database-schema';

// JWT Secrets — throws at startup in production if variables are missing
// Skip during Next.js build phase (NEXT_PHASE=phase-production-build) since
// secrets are only needed at runtime, not at static generation time.
function resolveSecret(envKey: string, devFallback: string): Uint8Array {
  const val = process.env[envKey];
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (!val && process.env.NODE_ENV === 'production' && !isBuildPhase) {
    throw new Error(`[startup] ${envKey} must be set in production`);
  }
  return new TextEncoder().encode(val || devFallback);
}

const JWT_SECRET = resolveSecret('JWT_SECRET', 'dev-secret-change-in-production-min-32-chars');
const REFRESH_SECRET = resolveSecret('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production-min-32-chars');

const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';
const OTP_EXPIRY_MINUTES = 15;

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export async function generateAccessToken(user: {
  id: string;
  email: string;
  role: string;
}): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setJti(generateId())
    .sign(JWT_SECRET);

  return token;
}

/**
 * Generate refresh token
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setJti(generateId())
    .sign(REFRESH_SECRET);

  return token;
}

/**
 * Verify and decode access token
 */
export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify and decode refresh token
 */
export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Register new user
 */
export async function registerUser(data: {
  full_name: string;
  email: string;
  password: string;
  role?: User['role'];
}): Promise<{
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
  otpCode: string;
}> {
  const users = db.table<User>('users');

  // Check if email already exists
  const existing = users.findOne({ email: data.email });
  if (existing) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);
  const otpCode = generateOTP();
  const now = new Date().toISOString();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Create user
  const user: User = {
    id: generateId(),
    full_name: data.full_name,
    email: data.email,
    password_hash: passwordHash,
    role: data.role || 'user',
    is_verified: false,
    is_blocked: false,
    otp_code: otpCode,
    otp_expires_at: otpExpiresAt,
    created_at: now,
    updated_at: now,
  };

  users.insert(user);

  // Generate tokens
  const accessToken = await generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  // Return user without password hash
  const { password_hash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
    otpCode, // In production, send via email, don't return
  };
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string): Promise<{
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
}> {
  const users = db.table<User>('users');

  // Find user
  const user = users.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if blocked
  if (user.is_blocked) {
    throw new Error('Account is blocked. Please contact support.');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const accessToken = await generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  // Return user without password
  const { password_hash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

/**
 * Verify email with OTP code
 */
export async function verifyEmail(email: string, otp: string): Promise<{
  success: boolean;
  message: string;
}> {
  const users = db.table<User>('users');
  const user = users.findOne({ email });

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (user.is_verified) {
    return { success: false, message: 'Email already verified' };
  }

  if (user.otp_code !== otp) {
    return { success: false, message: 'Invalid OTP code' };
  }

  if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
    return { success: false, message: 'OTP code expired. Please request new one.' };
  }

  // Mark as verified
  users.update(user.id, {
    is_verified: true,
    otp_code: undefined,
    otp_expires_at: undefined,
    updated_at: new Date().toISOString(),
  });

  return { success: true, message: 'Email verified successfully' };
}

/**
 * Send password reset OTP
 */
export async function sendPasswordResetOTP(email: string): Promise<{
  success: boolean;
  message: string;
  otpCode?: string; // Remove in production
}> {
  const users = db.table<User>('users');
  const user = users.findOne({ email });

  if (!user) {
    // Don't reveal if email exists
    return { success: true, message: 'If email exists, OTP sent' };
  }

  const otpCode = generateOTP();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  users.update(user.id, {
    otp_code: otpCode,
    otp_expires_at: otpExpiresAt,
    updated_at: new Date().toISOString(),
  });

  // In production, send via email
  return {
    success: true,
    message: 'OTP sent to email',
    otpCode, // Remove in production
  };
}

/**
 * Reset password with OTP
 */
export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const users = db.table<User>('users');
  const user = users.findOne({ email });

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (user.otp_code !== otp) {
    return { success: false, message: 'Invalid OTP code' };
  }

  if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
    return { success: false, message: 'OTP code expired' };
  }

  // Hash new password and update
  const passwordHash = await hashPassword(newPassword);
  users.update(user.id, {
    password_hash: passwordHash,
    otp_code: undefined,
    otp_expires_at: undefined,
    is_verified: true,
    updated_at: new Date().toISOString(),
  });

  return { success: true, message: 'Password reset successfully' };
}

/**
 * Get user by ID (without password)
 */
export function getUserById(id: string) {
  const users = db.table<User>('users');
  const user = users.findById(id);

  if (!user) return null;

  const { password_hash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Update user profile
 */
export function updateUser(id: string, updates: Partial<User>) {
  const users = db.table<User>('users');

  // Don't allow updating password directly
  const { password_hash, ...safeUpdates } = updates;

  return users.update(id, {
    ...safeUpdates,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Change password
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const users = db.table<User>('users');
  const user = users.findById(userId);

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  // Verify old password
  const isValid = await verifyPassword(oldPassword, user.password_hash);
  if (!isValid) {
    return { success: false, message: 'Invalid old password' };
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);
  users.update(userId, {
    password_hash: passwordHash,
    updated_at: new Date().toISOString(),
  });

  return { success: true, message: 'Password changed successfully' };
}

/**
 * Update user roles
 */
export function updateUserRoles(userId: string, roles: string[]) {
  const users = db.table<User>('users');
  const user = users.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Determine primary role (first in list or admin if present)
  const primaryRole = roles.includes('admin')
    ? 'admin'
    : (roles[0] as User['role']);

  return users.update(userId, {
    role: primaryRole,
    assigned_roles: roles,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Block/unblock user
 */
export function toggleUserBlock(userId: string, blocked: boolean) {
  const users = db.table<User>('users');

  return users.update(userId, {
    is_blocked: blocked,
    updated_at: new Date().toISOString(),
  });
}
