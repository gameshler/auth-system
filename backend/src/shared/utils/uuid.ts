import { randomUUID as uuidv4 } from "crypto";

export function generateUniqueCode() {
  return uuidv4().replace(/-/g, "").substring(0, 24);
}
