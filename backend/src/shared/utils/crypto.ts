import crypto, { randomBytes } from "crypto";
import appAssert from "./appAssert";
import { INTERNAL_SERVER_ERROR } from "../../constants/http";
import { JWT_REFRESH_SECRET, MFA_ENCRYPTION_KEY } from "../../constants/env";

const ALGORITHM = "aes-256-gcm";

const ENCRYPTION_KEY = Buffer.from(MFA_ENCRYPTION_KEY, "base64");

export const hashCode = (code: string): string =>
  crypto.createHash("sha256").update(code).digest("hex");

export const hashSecret = (secret: string): string =>
  crypto.createHmac("sha256", MFA_ENCRYPTION_KEY).update(secret).digest("hex");

export const hashToken = (token: string): string =>
  crypto.createHmac("sha256", JWT_REFRESH_SECRET).update(token).digest("hex");

export const encryptSecret = (text: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decryptSecret = (hash: string): string => {
  const [iv, authTag, encrypted] = hash.split(":");
  appAssert(iv && authTag && encrypted, INTERNAL_SERVER_ERROR, "server error");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export const safeEqual = (a: string, b: string): boolean => {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");

    if (bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

export const generateUniqueCode = (): string =>
  randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .replace(/=+$/, "")
    .toLowerCase();

export const generateBackupCodes = (count = 1): string[] => {
  return Array.from({ length: count }, () =>
    randomBytes(10).toString("base64url").toUpperCase(),
  );
};
