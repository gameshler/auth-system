import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(10, { error: "Email is required" })
  .max(120, { error: "Email is too long" })
  .pipe(z.email("Invalid email address"))
  .transform((val) => val.toLowerCase());
const passwordSchema = z
  .string()
  .min(12, { error: "Password must be at least 12 characters long" })
  .max(30, { error: "Password too long" })
  .regex(/[A-Z]/, { error: "Must include an uppercase letter" })
  .regex(/[a-z]/, { error: "Must include a lowercase letter" })
  .regex(/[0-9]/, { error: "Must include a number" })
  .regex(/[^A-Za-z0-9]/, { error: "Must include a special character" });
const userAgentSchema = z.string().optional();
const ipSchema = z.string().optional();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, { error: "Password is required" }),
    userAgent: userAgentSchema,
    ip: ipSchema,
  })
  .strict();

export const registerSchema = z
  .object({
    email: emailSchema,
    fullName: z
      .string()
      .trim()
      .min(3, { error: "Full name is required" })
      .max(50, { error: "Full name is too long" }),
    password: passwordSchema,
    confirmPassword: z.string(),
    userAgent: userAgentSchema,
    ip: ipSchema,
  })
  .strict()
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const verificationCodeSchema = z
  .string()
  .trim()
  .min(40, { error: "Invalid verification code" })
  .max(45, { error: "Invalid verification code" })
  .regex(/^[A-Za-z0-9-_]+$/, { error: "Invalid verification code " });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  userAgent: userAgentSchema,
  ip: ipSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    verificationCode: verificationCodeSchema,
    userAgent: userAgentSchema,
    ip: ipSchema,
  })
  .strict();
