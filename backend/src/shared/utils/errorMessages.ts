const Messages = () => ({
  InvalidCredentials: "Invalid email or password",

  Unauthorized: "You are not allowed to perform this action",
  Forbidden: "Access denied",

  SessionExpired: "Your session has expired, please sign in again",
  InvalidSession: "Please sign in again",

  EmailInUse: "An account with this email already exists",
  AccountNotFound: "Unable to process request",

  InvalidToken: "Invalid or expired link",
  TokenExpired: "Invalid or expired link",
  VerificationFailed: "Verification failed",

  TooManyRequests: "Too many attempts, please try again later",

  NotFound: "Not found",
  ServerError: "Something went wrong, please try again later",
});

export const ErrorMessages = Messages();
