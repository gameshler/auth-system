import crypto from "crypto";
import bcrypt from "bcryptjs";

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const hashValue = async (value: string, saltRounds?: number) =>
  bcrypt.hash(value, saltRounds || 15);

export const compareValue = async (value: string, hashedValue: string) =>
  bcrypt.compare(value, hashedValue).catch(() => false);
