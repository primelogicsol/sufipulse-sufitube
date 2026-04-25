/**
 * server/services/auth.ts
 *
 * Authentication business logic:
 *   - Password hashing (bcrypt)
 *   - JWT generation and verification
 *   - OTP generation
 *   - Register / Login / Verify email / Reset password
 *
 * This service owns auth rules. Repositories handle raw DB access.
 * API routes call this service — they contain no auth logic themselves.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { generateId } from '@/lib/database';
import { usersRepository } from '@/server/db/repositories/users';
import { config } from '@/server/config';
import type { User, WithoutPassword } from '@/server/types';

// ─── Token secrets ────────────────────────────────────────────────────────────

const accessSecret = () => new TextEncoder().encode(config.auth.jwtSecret);
const refreshSecret = () => new TextEncoder().encode(config.auth.jwtRefreshSecret);

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.auth.bcryptRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

export async function generateAccessToken(user: {
  id: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ userId: user.id, email: user.email, role: user.role } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.auth.accessTokenExpiry)
    .setJti(generateId())
    .sign(accessSecret());
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.auth.refreshTokenExpiry)
    .setJti(generateId())
    .sign(refreshSecret());
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret());
    return payload;
  } catch {
    return null;
  }
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}

function otpExpiresAt(): string {
  return new Date(Date.now() + config.auth.otpExpiryMinutes * 60 * 1000).toISOString();
}

// ─── User helpers ─────────────────────────────────────────────────────────────

function stripPassword(user: User): WithoutPassword<User> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = user;
  return safe;
}

export function getUserById(id: string): WithoutPassword<User> | null {
  const user = usersRepository.findById(id);
  return user ? stripPassword(user) : null;
}

// ─── Auth flows ───────────────────────────────────────────────────────────────

export async function registerUser(data: {
  full_name: string;
  email: string;
  password: string;
  role?: User['role'];
}): Promise<{
  user: WithoutPassword<User>;
  accessToken: string;
  refreshToken: string;
  otpCode: string;
}> {
  if (usersRepository.findByEmail(data.email)) {
    throw new Error('Email already registered');
  }

  const otpCode = generateOTP();
  const user = usersRepository.create({
    full_name: data.full_name,
    email: data.email,
    password_hash: await hashPassword(data.password),
    role: data.role || 'user',
    is_verified: false,
    is_blocked: false,
    otp_code: otpCode,
    otp_expires_at: otpExpiresAt(),
  });

  return {
    user: stripPassword(user),
    accessToken: await generateAccessToken(user),
    refreshToken: await generateRefreshToken(user.id),
    otpCode,
  };
}

export async function loginUser(email: string, password: string): Promise<{
  user: WithoutPassword<User>;
  accessToken: string;
  refreshToken: string;
}> {
  const user = usersRepository.findByEmail(email);

  if (!user) throw new Error('Invalid email or password');
  if (user.is_blocked) throw new Error('Account is blocked. Please contact support.');
  if (!(await verifyPassword(password, user.password_hash))) {
    throw new Error('Invalid email or password');
  }

  return {
    user: stripPassword(user),
    accessToken: await generateAccessToken(user),
    refreshToken: await generateRefreshToken(user.id),
  };
}

export async function verifyEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  const user = usersRepository.findByEmail(email);

  if (!user) return { success: false, message: 'User not found' };
  if (user.is_verified) return { success: false, message: 'Email already verified' };
  if (user.otp_code !== otp) return { success: false, message: 'Invalid OTP code' };
  if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
    return { success: false, message: 'OTP code expired. Please request a new one.' };
  }

  usersRepository.setVerified(user.id);
  return { success: true, message: 'Email verified successfully' };
}

export async function sendPasswordResetOTP(email: string): Promise<{
  success: boolean;
  message: string;
  otpCode?: string;
}> {
  const user = usersRepository.findByEmail(email);

  // Don't reveal whether the email exists
  if (!user) return { success: true, message: 'If the email exists, an OTP has been sent' };

  const otpCode = generateOTP();
  usersRepository.setOtp(user.id, otpCode, otpExpiresAt());

  return {
    success: true,
    message: 'OTP sent to email',
    otpCode, // caller must remove this in production after sending via email
  };
}

export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const user = usersRepository.findByEmail(email);

  if (!user) return { success: false, message: 'User not found' };
  if (user.otp_code !== otp) return { success: false, message: 'Invalid OTP code' };
  if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
    return { success: false, message: 'OTP code expired' };
  }

  usersRepository.setPasswordHash(user.id, await hashPassword(newPassword));
  return { success: true, message: 'Password reset successfully' };
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const user = usersRepository.findById(userId);

  if (!user) return { success: false, message: 'User not found' };
  if (!(await verifyPassword(oldPassword, user.password_hash))) {
    return { success: false, message: 'Invalid current password' };
  }

  usersRepository.setPasswordHash(userId, await hashPassword(newPassword));
  return { success: true, message: 'Password changed successfully' };
}

export function updateUserRoles(userId: string, roles: string[]) {
  const user = usersRepository.findById(userId);
  if (!user) throw new Error('User not found');

  const primaryRole = roles.includes('admin')
    ? 'admin'
    : (roles[0] as User['role']);

  return usersRepository.setRoles(userId, primaryRole, roles);
}
