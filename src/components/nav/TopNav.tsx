'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * TopNav - A reusable, accessible top navigation bar
 * Clones the exact visual style from the Vehicles page navigation
 *
 * Styles extracted from vehicles.tsx (lines 466-479):
 * - Wrapper: border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20
 * - Content padding: px-6 py-4
 * - Tab styling: flex items-center gap-2
 * - Icons: h-4 w-4
 * - Base tab trigger: text-sm font-medium with focus-visible rings
 * - Active state: bg-background text-foreground shadow
 */

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface Tab {
  label: string;
  href: string;
  isActive?: boolean;
  badgeCount?: number;
  icon?: React.ReactNode;
}

export interface TopNavProps {
  /**
   * Breadcrumb navigation items
   */
  breadcrumbs?: Breadcrumb[];

  /**
   * Tab navigation items
   */
  tabs?: Tab[];

  /**
   * Actions to render on the right side (e.g., buttons, filters)
   */
  actionsRight?: React.ReactNode;

  /**
   * Whether the nav should stick to the top of the viewport
   * @default true
   */
  sticky?: boolean;

  /**
   * Custom className for the wrapper
   */
  className?: string;

  /**
   * Aria label for the navigation
   * @default "Primary"
   */
  ariaLabel?: string;
}

/**
 * Breadcrumb component with mobile collapse
 */
function BreadcrumbNav({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) {
  const [showFullPath, setShowFullPath] = React.useState(false);
  const router = useRouter();

  // On mobile, show only last item + back button
  // On desktop, show full breadcrumb trail
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const displayBreadcrumbs = isMobile && !showFullPath ? breadcrumbs.slice(-1) : breadcrumbs;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
      {/* Mobile back button */}
      {breadcrumbs.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-7 w-7"
          onClick={() => {
            const previousBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
            if (previousBreadcrumb?.href) {
              router.push(previousBreadcrumb.href);
            }
          }}
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <ol className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {displayBreadcrumbs.map((crumb, index) => {
          const isLast = index === displayBreadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-2 whitespace-nowrap">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn(isLast && 'text-foreground font-medium')}>{crumb.label}</span>
              )}

              {!isLast && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Tab navigation with keyboard support and horizontal scroll on mobile
 */
function TabNav({ tabs }: { tabs: Tab[] }) {
  const tabListRef = React.useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(
    tabs.findIndex((tab) => tab.isActive) || 0,
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newIndex = Math.max(0, currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      newIndex = Math.min(tabs.length - 1, currentIndex + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = tabs.length - 1;
    }

    if (newIndex !== currentIndex) {
      setFocusedIndex(newIndex);
      // Focus the new tab
      const tabElements = tabListRef.current?.querySelectorAll('[role="tab"]');
      if (tabElements?.[newIndex]) {
        (tabElements[newIndex] as HTMLElement).focus();
      }
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Primary navigation tabs"
      ref={tabListRef}
      className="flex items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pb-1 -mb-1"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.isActive;

        return (
          <Link
            key={index}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => setFocusedIndex(index)}
            className={cn(
              // Base styles from shadcn TabsTrigger
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              // Active state matching vehicles.tsx
              'flex items-center gap-2',
              isActive
                ? 'bg-background text-foreground shadow'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {tab.icon && (
              <span className="h-4 w-4 shrink-0" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 px-1 text-xs"
                aria-label={`${tab.badgeCount} items`}
              >
                {tab.badgeCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * TopNav Component
 *
 * A flexible top navigation bar that supports breadcrumbs, tabs, and action buttons.
 * Matches the exact visual style from the Vehicles page.
 */
export function TopNav({
  breadcrumbs,
  tabs,
  actionsRight,
  sticky = true,
  className,
  ariaLabel = 'Primary',
}: TopNavProps) {
  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;
  const hasTabs = tabs && tabs.length > 0;
  const hasActions = !!actionsRight;

  return (
    <nav aria-label={ariaLabel} className={cn(sticky && 'sticky top-0 z-40', className)}>
      {/* Exact styles from vehicles.tsx lines 466-479 */}
      <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
        <CardContent className="px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Breadcrumbs Row */}
            {hasBreadcrumbs && (
              <div className="flex items-center justify-between gap-4">
                <BreadcrumbNav breadcrumbs={breadcrumbs} />
                {hasActions && !hasTabs && (
                  <div className="flex items-center gap-2 shrink-0">{actionsRight}</div>
                )}
              </div>
            )}

            {/* Tabs Row */}
            {hasTabs && (
              <div className="flex items-center justify-between gap-4">
                <TabNav tabs={tabs} />
                {hasActions && (
                  <div className="hidden sm:flex items-center gap-2 shrink-0">{actionsRight}</div>
                )}
              </div>
            )}

            {/* Mobile actions (when tabs exist) */}
            {hasTabs && hasActions && (
              <div className="sm:hidden flex items-center gap-2">{actionsRight}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </nav>
  );
}

export default TopNav;
