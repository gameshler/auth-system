import z from "zod";

export const mfaSetupVerifySchema = z.object({
  code: z.string().min(6).max(8),
});

export const mfaLoginSchema = z.object({
  challengeId: z.string(),
  code: z.string().min(6).max(8),
});

export const mfaSchema = z.object({
  password: z.string().min(12).max(25),
});
