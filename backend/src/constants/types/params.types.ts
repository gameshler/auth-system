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
