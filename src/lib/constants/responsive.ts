/**
 * Responsive Design Constants
 *
 * Standardized grid patterns and breakpoints for consistent responsive behavior
 * across all components. These patterns follow Tailwind CSS breakpoints:
 *
 * - sm: 640px (small screens)
 * - md: 768px (tablets)
 * - lg: 1024px (desktops)
 * - xl: 1280px (large desktops)
 * - 2xl: 1536px (extra large screens)
 */

/**
 * Standardized grid column patterns for common layouts
 */
export const GRID_PATTERNS = {
  /**
   * Stats/Metrics cards (4 items)
   * Mobile: 1 column → Small: 2 columns → Large: 4 columns
   */
  stats: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',

  /**
   * Form fields (2 columns)
   * Mobile: 1 column → Tablet+: 2 columns
   */
  form: 'grid-cols-1 md:grid-cols-2',

  /**
   * Content cards (3 columns)
   * Mobile: 1 column → Tablet: 2 columns → Desktop: 3 columns
   */
  cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',

  /**
   * Quick actions (3-5 items)
   * Mobile: 1 column → Small: 2 columns → Large: 3 columns → XL: 5 columns
   */
  actions: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',

  /**
   * Dashboard stats (6 items)
   * Mobile: 1 column → Small: 2 columns → Large: 3 columns → XL: 6 columns
   */
  dashboardStats: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',

  /**
   * Material/Purchase items (4 columns)
   * Mobile: 1 column → Small: 2 columns → Large: 4 columns
   */
  items: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
} as const;

/**
 * Standard gap sizes for grids
 */
export const GAP_SIZES = {
  small: 'gap-4',
  medium: 'gap-6',
  large: 'gap-8',
} as const;

/**
 * Standard padding sizes for responsive containers
 */
export const PADDING_SIZES = {
  mobile: 'px-3 sm:px-4',
  tablet: 'px-4 md:px-6',
  desktop: 'px-6 lg:px-8',
  responsive: 'px-3 sm:px-4 md:px-6 lg:px-8',
} as const;

/**
 * Typography scaling patterns
 */
export const TYPOGRAPHY_SCALES = {
  h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
  body: 'text-sm sm:text-base md:text-lg',
  small: 'text-xs sm:text-sm',
} as const;

/**
 * Breakpoint values (in pixels) - matches Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
