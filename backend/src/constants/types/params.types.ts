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

export type CreateAuthenticatedSessionParams = {
  userId: mongoose.Types.ObjectId;
  role: Role;
  verified: boolean;
  userAgent?: string;
  ip?: string;
};
