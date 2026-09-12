import z from "zod";

export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6,8}$/);

export const backupCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{8,64}$/);

export const mfaSetupVerifySchema = z.object({
  code: totpCodeSchema,
});

export const mfaLoginSchema = z.object({
  challengeId: z
    .string()
    .length(24)
    .regex(/^[a-f\d]{24}$/i),
  code: z.union([totpCodeSchema, backupCodeSchema]),
});

export const mfaSchema = z.object({
  password: z.string().min(12).max(30),
});
