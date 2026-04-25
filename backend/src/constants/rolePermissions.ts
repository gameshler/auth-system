import Role from "./enums/roles";
import Permission from "./enums/permissions";

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.USER_READ_SELF,

    Permission.SESSION_READ_SELF,
    Permission.SESSION_DELETE_SELF,

    Permission.ACCOUNT_DELETE_SELF,
  ],

  [Role.ADMIN]: [
    Permission.USER_READ_SELF,
    Permission.USER_READ_ANY,

    Permission.SESSION_READ_SELF,
    Permission.SESSION_READ_ANY,

    Permission.SESSION_DELETE_SELF,
    Permission.SESSION_DELETE_ANY,

    Permission.ACCOUNT_DELETE_SELF,
    Permission.USER_DELETE_ANY,

    Permission.USER_ROLE_UPDATE,

    Permission.ADMIN_ACCESS,
  ],
};
