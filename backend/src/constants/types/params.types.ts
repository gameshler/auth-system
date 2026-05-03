import mongoose from "mongoose";
import Role from "../enums/roles";

export type CreateAccountParams = {
  fullName: string;
  email: string;
  password: string;
  userAgent?: string;
  ip?: string;
};

export type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
  ip?: string;
};

export type ResetPasswordParams = {
  password: string;
  verificationCode: string;
  userAgent?: string;
  ip?: string;
};

export type ForgotPasswordParams = {
  email: string;
  userAgent?: string;
  ip?: string;
};

export type UserParams = {
  userId: mongoose.Types.ObjectId;
};

export type MfaSetupParams = {
  userId: mongoose.Types.ObjectId;
  code: string;
};

export type MfaLoginParams = {
  challengeId: string;
  code: string;
  userAgent?: string;
  ip?: string;
};

export type DisableMfaParams = {
  userId: mongoose.Types.ObjectId;
  password: string;
};

export type RegenBackupCodesParams = {
  userId: mongoose.Types.ObjectId;
  password: string;
};

export type CreateAuthenticatedSessionParams = {
  userId: mongoose.Types.ObjectId;
  role: Role;
  verified: boolean;
  userAgent?: string;
  ip?: string;
};
