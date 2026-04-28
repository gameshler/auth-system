const enum AppErrorCode {
  // Auth
  InvalidCredentials = "invalid_credentials",
  Unauthorized = "unauthorized",
  Forbidden = "forbidden",

  // Session
  SessionExpired = "session_expired",
  InvalidSession = "session_invalid",

  // Account
  EmailInUse = "email_in_use",
  AccountNotFound = "account_not_found",

  // Tokens / verification
  InvalidToken = "invalid_token",
  VerificationFailed = "verification_failed",

  // Rate limiting
  TooManyRequests = "too_many_requests",

  // General
  NotFound = "not_found",
  ServerError = "server_error",
}

export default AppErrorCode;
