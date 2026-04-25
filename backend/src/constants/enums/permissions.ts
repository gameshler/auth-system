const enum Permission {
  USER_READ_SELF = "user.read.self",
  USER_READ_ANY = "user.read.any",

  SESSION_READ_SELF = "session.read.self",
  SESSION_READ_ANY = "session.read.any",

  SESSION_DELETE_SELF = "session.delete.self",
  SESSION_DELETE_ANY = "session.delete.any",

  ACCOUNT_DELETE_SELF = "account.delete.self",
  USER_DELETE_ANY = "user.delete.any",

  USER_ROLE_UPDATE = "user.role.update",

  ADMIN_ACCESS = "admin.access",
}

export default Permission;
