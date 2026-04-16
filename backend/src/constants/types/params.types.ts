export type CreateAccountParams = {
  fullName: string;
  email: string;
  password: string;
  userAgent?: string;
};

export type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};
