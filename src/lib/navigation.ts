/**
 * Navigation Utilities
 * Provides route mapping and prefetching helpers
 */

export const routeMap: Record<string, string> = {
  dashboard: '/dashboard',
  sites: '/sites',
  materials: '/materials',
  purchase: '/purchase',
  'work-progress': '/work-progress',
  vehicles: '/vehicles',
  vendors: '/vendors',
  expenses: '/expenses',
  payments: '/payments',
  scheduling: '/scheduling',
  reports: '/reports',
  organization: '/organization',
  masters: '/masters',
  settings: '/settings',
  home: '/',
  login: '/login',
};

/**
 * Get route for a page ID
 */
export function getRoute(pageId: string): string {
  return routeMap[pageId] || '/';
}

/**
 * Get all routes for prefetching
 */
export function getAllRoutes(): string[] {
  return Object.values(routeMap).filter((route) => route !== '/login');
}
