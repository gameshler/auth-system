import mongoose from "mongoose";
import verificationCodeType from "../enums/verificationCodeTypes";

export interface sessionDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  ip?: string;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface UserDocument extends mongoose.Document {
  fullName: string;
  email: string;
  password: string;
  verified: boolean;

  role: "user" | "admin";

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
    | "createdAt"
    | "updatedAt"
  >;
}

export interface verificationCodeDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: verificationCodeType;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}
