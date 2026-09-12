import mongoose from "mongoose";
import verificationCodeType from "../enums/verificationCodeTypes";
import Role from "../enums/roles";

export interface sessionDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  ip?: string;
  previousRefreshToken?: string;
  refreshToken: string;
  tokenRotatedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface MfaDocument extends mongoose.Document {
  enabled: boolean;
  secret?: string;
  tempSecret?: string;
  backupCodes: string[];
  lastUsedStep?: number;
  failedAttempts: number;
  lockoutUntil?: Date;
  tempSecretCreatedAt: Date;
}

export interface UserDocument extends mongoose.Document {
  fullName: string;
  email: string;
  password: string;
  verified: boolean;
  mfa: MfaDocument;
  role: Role;

  createdAt: Date;
  updatedAt: Date;
  comparePassword(val: string): Promise<boolean>;
  omitPassword(): Pick<
    UserDocument,
    | "_id"
    | "email"
    | "verified"
    | "fullName"
    | "role"
    | "mfa"
    | "createdAt"
    | "updatedAt"
  >;
  checkLockout(): void;
}

export interface verificationCodeDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: verificationCodeType;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}
