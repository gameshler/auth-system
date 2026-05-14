const Messages = () => ({
  // Auth
  InvalidCredentials: "Invalid credentials",
  UserVerified: "Already verified",

  // Authorization
  Unauthorized: "Unauthorized",
  Forbidden: "Access denied",
  AccountLocked: "Account locked",

  // Session
  InvalidSession: "Please sign in again",

  // Account-related operations
  AccountOperationFailed: "Process failed",

  // Tokens
  InvalidOrExpiredToken: "Invalid or expired link",

  // Rate limiting
  TooManyRequests: "Too many attempts, please try again later",

  // General
  NotFound: "Not found",
  ServerError: "Something went wrong, please try again later",
});

export const ErrorMessages = Messages();
