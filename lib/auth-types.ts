export interface User {
  id: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type OtpChannel = "email" | "phone";

export interface OtpChallenge {
  id: string;
  channel: OtpChannel;
  identifier: string;
  codeHash: string;
  expiresAt: string;
  consumedAt: string | null;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
}

export interface AuthSessionPayload {
  userId: string;
  email: string;
  phone: string;
}
