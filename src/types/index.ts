/**
 * Central export point for all types in Gavith Build
 * Re-exports all entity and form types for convenience
 */

// Entity types
export * from './entities';

// RBAC types
export * from './rbac';

// Legacy user type for backward compatibility
export interface LegacyUser {
  username: string;
  companyName: string;
  role: string;
}
