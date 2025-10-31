/**
 * Role-Based Access Control (RBAC) types and enums
 * Defines roles, permissions, and access control for multi-tenant construction management
 */

/**
 * Primary user roles
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * Organization-specific roles with hierarchical permissions
 */
export enum OrganizationRole {
  OWNER = 'owner', // Full access, billing control
  ADMIN = 'admin', // Full data management access
  MANAGER = 'manager', // Project and resource management
  USER = 'user', // Basic read/write access
  // Specific role types
  PROJECT_MANAGER = 'project-manager',
  SITE_SUPERVISOR = 'site-supervisor',
  MATERIALS_MANAGER = 'materials-manager',
  FINANCE_MANAGER = 'finance-manager',
  EXECUTIVE = 'executive',
}

/**
 * Permission types for granular access control
 */
export enum Permission {
  // Organization permissions
  ORG_VIEW = 'org:view',
  ORG_EDIT = 'org:edit',
  ORG_BILLING = 'org:billing',
  ORG_DELETE = 'org:delete',

  // User management permissions
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_INVITE = 'user:invite',

  // Site permissions
  SITE_VIEW = 'site:view',
  SITE_CREATE = 'site:create',
  SITE_EDIT = 'site:edit',
  SITE_DELETE = 'site:delete',
  SITE_MANAGE_TEAM = 'site:manage-team',

  // Material permissions
  MATERIAL_VIEW = 'material:view',
  MATERIAL_CREATE = 'material:create',
  MATERIAL_EDIT = 'material:edit',
  MATERIAL_DELETE = 'material:delete',
  MATERIAL_RECEIVE = 'material:receive',

  // Vendor permissions
  VENDOR_VIEW = 'vendor:view',
  VENDOR_CREATE = 'vendor:create',
  VENDOR_EDIT = 'vendor:edit',
  VENDOR_DELETE = 'vendor:delete',

  // Vehicle permissions
  VEHICLE_VIEW = 'vehicle:view',
  VEHICLE_CREATE = 'vehicle:create',
  VEHICLE_EDIT = 'vehicle:edit',
  VEHICLE_DELETE = 'vehicle:delete',
  VEHICLE_TRACK = 'vehicle:track',

  // Expense permissions
  EXPENSE_VIEW = 'expense:view',
  EXPENSE_CREATE = 'expense:create',
  EXPENSE_EDIT = 'expense:edit',
  EXPENSE_DELETE = 'expense:delete',
  EXPENSE_APPROVE = 'expense:approve',

  // Payment permissions
  PAYMENT_VIEW = 'payment:view',
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_EDIT = 'payment:edit',
  PAYMENT_DELETE = 'payment:delete',
  PAYMENT_APPROVE = 'payment:approve',

  // Reports permissions
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',
  REPORT_FINANCIAL = 'report:financial',
}

/**
 * Role permission mapping
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
  [OrganizationRole.OWNER]: Object.values(Permission),
  [OrganizationRole.ADMIN]: Object.values(Permission).filter(
    (p) => p !== Permission.ORG_BILLING && p !== Permission.ORG_DELETE,
  ),
  [OrganizationRole.PROJECT_MANAGER]: [
    Permission.SITE_VIEW,
    Permission.SITE_CREATE,
    Permission.SITE_EDIT,
    Permission.SITE_MANAGE_TEAM,
    Permission.MATERIAL_VIEW,
    Permission.MATERIAL_CREATE,
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_CREATE,
    Permission.REPORT_VIEW,
  ],
  [OrganizationRole.SITE_SUPERVISOR]: [
    Permission.SITE_VIEW,
    Permission.MATERIAL_VIEW,
    Permission.MATERIAL_RECEIVE,
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_CREATE,
    Permission.VEHICLE_VIEW,
    Permission.VEHICLE_TRACK,
  ],
  [OrganizationRole.MATERIALS_MANAGER]: [
    Permission.MATERIAL_VIEW,
    Permission.MATERIAL_CREATE,
    Permission.MATERIAL_EDIT,
    Permission.MATERIAL_DELETE,
    Permission.MATERIAL_RECEIVE,
    Permission.VENDOR_VIEW,
    Permission.VENDOR_CREATE,
    Permission.VENDOR_EDIT,
  ],
  [OrganizationRole.FINANCE_MANAGER]: [
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_CREATE,
    Permission.EXPENSE_EDIT,
    Permission.EXPENSE_APPROVE,
    Permission.PAYMENT_VIEW,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_EDIT,
    Permission.PAYMENT_APPROVE,
    Permission.VENDOR_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.REPORT_FINANCIAL,
  ],
  [OrganizationRole.EXECUTIVE]: [
    Permission.SITE_VIEW,
    Permission.EXPENSE_VIEW,
    Permission.PAYMENT_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.REPORT_FINANCIAL,
  ],
  [OrganizationRole.MANAGER]: [
    Permission.SITE_VIEW,
    Permission.SITE_CREATE,
    Permission.SITE_EDIT,
    Permission.MATERIAL_VIEW,
    Permission.MATERIAL_CREATE,
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_CREATE,
    Permission.VEHICLE_VIEW,
    Permission.REPORT_VIEW,
  ],
  [OrganizationRole.USER]: [
    Permission.SITE_VIEW,
    Permission.MATERIAL_VIEW,
    Permission.EXPENSE_VIEW,
    Permission.VEHICLE_VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: OrganizationRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: OrganizationRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Type guard to check if organization role has permission
 */
export function canAccess(role: OrganizationRole, permission: Permission): boolean {
  return hasPermission(role, permission);
}
