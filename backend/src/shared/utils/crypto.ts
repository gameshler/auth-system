import crypto, { randomBytes, randomUUID as uuidv4 } from "crypto";
import appAssert from "./appAssert";
import { INTERNAL_SERVER_ERROR } from "../../constants/http";
import { MFA_ENCRYPTION_KEY } from "../../constants/env";

const ALGORITHM = "aes-256-gcm";

export const hashCode = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const hashSecret = (secret: string): string =>
  crypto.createHmac("sha256", MFA_ENCRYPTION_KEY!).update(secret).digest("hex");

export const encryptSecret = (text: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(MFA_ENCRYPTION_KEY!),
    iv,
  );
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
    Buffer.from(MFA_ENCRYPTION_KEY!),
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export const generateUniqueCode = () => {
  return uuidv4().replace(/-/g, "").substring(0, 24);
};

export const generateBackupCodes = (count = 5) => {
  return Array.from({ length: count }, () =>
    randomBytes(4).toString("hex").toUpperCase(),
  );
};
