export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  CLIENT: 'client',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
  client: 'Client',
};

export const ROLE_HIERARCHY = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  employee: 2,
  client: 1,
};

export const hasMinRole = (userRole, requiredRole) =>
  (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
