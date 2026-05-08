const enum AppErrorCode {
  // Auth
  InvalidCredentials = "invalid_credentials",
  InvalidMfaCode = "invalid_mfa_code",
  MfaAlreadyEnabled = "mfa_already_enabled",

  // Authorization
  Unauthorized = "unauthorized",
  Forbidden = "forbidden",

  // Session
  SessionExpired = "session_expired",
  InvalidSession = "session_invalid",

  // Tokens
  InvalidToken = "invalid_token",
  TokenExpired = "token_expired",
  VerificationFailed = "verification_failed",

  // Abuse protection
  TooManyRequests = "too_many_requests",

  // General
  NotFound = "not_found",
  ServerError = "server_error",
}

export default AppErrorCode;
