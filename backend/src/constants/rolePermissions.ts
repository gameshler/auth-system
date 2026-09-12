import Role from "./enums/roles";
import Permission from "./enums/permissions";

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.USER_READ_SELF,
    Permission.USER_VERIFY_SELF,

    Permission.SESSION_READ_SELF,
    Permission.SESSION_DELETE_SELF,

    Permission.ACCOUNT_DELETE_SELF,

    Permission.MFA_SETUP_SELF,
    Permission.MFA_DISABLE_SELF,
    Permission.MFA_MANAGE_BACKUP_CODES_SELF,
  ],

  [Role.ADMIN]: [
    Permission.USER_READ_SELF,
    Permission.USER_READ_ANY,
    Permission.USER_VERIFY_SELF,

    Permission.SESSION_READ_SELF,
    Permission.SESSION_READ_ANY,

    Permission.SESSION_DELETE_SELF,
    Permission.SESSION_DELETE_ANY,

    Permission.ACCOUNT_DELETE_SELF,
    Permission.USER_DELETE_ANY,

    Permission.USER_ROLE_UPDATE,

    Permission.MFA_SETUP_SELF,
    Permission.MFA_DISABLE_SELF,
    Permission.MFA_MANAGE_BACKUP_CODES_SELF,

    Permission.ADMIN_ACCESS,
  ],
};
