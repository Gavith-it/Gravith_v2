# TopNav Component

A reusable, accessible top navigation bar component that clones the exact visual style from the Vehicles page navigation.

## Visual Styles Extracted

From `src/components/vehicles.tsx` (lines 466-479):

- **Wrapper Card**: `border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20`
- **Content Padding**: `px-6 py-4`
- **Tab Base Styles**: `flex items-center gap-2`
- **Typography**: `text-sm font-medium`
- **Icons**: `h-4 w-4`
- **Active State**: `bg-background text-foreground shadow`
- **Inactive State**: `text-muted-foreground hover:bg-muted/50 hover:text-foreground`
- **Focus Styles**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

## Features

- ✅ **Exact visual parity** with Vehicles page navigation
- ✅ **Sticky positioning** (default) with subtle bottom border
- ✅ **Responsive behavior**:
  - Breadcrumbs collapse to last item + back button on mobile
  - Tabs scroll horizontally on small screens
  - Actions stack on mobile
- ✅ **Full accessibility**:
  - Proper ARIA attributes (`role="tablist"`, `role="tab"`, `aria-selected`)
  - Keyboard navigation (Left/Right arrows, Home/End)
  - Focus-visible rings
  - Screen reader support
- ✅ **Flexible API** for breadcrumbs, tabs, badges, and custom actions

## Props

```typescript
interface TopNavProps {
  breadcrumbs?: { label: string; href?: string }[];
  tabs?: {
    label: string;
    href: string;
    isActive?: boolean;
    badgeCount?: number;
    icon?: React.ReactNode;
  }[];
  actionsRight?: React.ReactNode;
  sticky?: boolean; // default: true
  className?: string;
  ariaLabel?: string; // default: "Primary"
}
```

## Usage Examples

### Basic Tabs Navigation

```tsx
import { TopNav } from '@/components/nav/TopNav';
import { Fuel, Activity } from 'lucide-react';

export function VehiclePage() {
  return (
    <TopNav
      tabs={[
        {
          label: 'Refueling',
          href: '/vehicles/refueling',
          isActive: true,
          icon: <Fuel />,
        },
        {
          label: 'Usage',
          href: '/vehicles/usage',
          icon: <Activity />,
        },
      ]}
    />
  );
}
```

### With Breadcrumbs and Actions

```tsx
import { TopNav } from '@/components/nav/TopNav';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function SitePage() {
  return (
    <TopNav
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Sites', href: '/sites' },
        { label: 'Site Details' },
      ]}
      tabs={[
        { label: 'Overview', href: '/sites/1', isActive: true },
        { label: 'Materials', href: '/sites/1/materials', badgeCount: 12 },
        { label: 'Progress', href: '/sites/1/progress' },
      ]}
      actionsRight={
        <>
          <Button variant="outline">Export</Button>
          <Button>
            <Plus className="h-4 w-4" />
            New Item
          </Button>
        </>
      }
    />
  );
}
```

### Breadcrumbs Only

```tsx
import { TopNav } from '@/components/nav/TopNav';

export function DetailPage() {
  return (
    <TopNav
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: 'Project Alpha' },
      ]}
      actionsRight={<Button>Edit</Button>}
    />
  );
}
```

### With Badge Counts

```tsx
import { TopNav } from '@/components/nav/TopNav';

export function TasksPage() {
  return (
    <TopNav
      tabs={[
        {
          label: 'Active',
          href: '/tasks/active',
          isActive: true,
          badgeCount: 8,
        },
        {
          label: 'Pending',
          href: '/tasks/pending',
          badgeCount: 23,
        },
        {
          label: 'Completed',
          href: '/tasks/completed',
        },
      ]}
    />
  );
}
```

### Non-Sticky Navigation

```tsx
import { TopNav } from '@/components/nav/TopNav';

export function StaticPage() {
  return (
    <TopNav
      sticky={false}
      tabs={[
        { label: 'Tab 1', href: '/tab1', isActive: true },
        { label: 'Tab 2', href: '/tab2' },
      ]}
    />
  );
}
```

## Accessibility

- **Breadcrumbs**: `<nav aria-label="Breadcrumb">` with proper list semantics
- **Tabs**: `role="tablist"` with `role="tab"`, `aria-selected`, and `aria-current`
- **Keyboard Navigation**:
  - `Left/Right Arrow`: Navigate between tabs
  - `Home/End`: Jump to first/last tab
  - `Tab`: Focus management follows standard patterns
- **Focus Management**: Visible focus rings, keyboard trap prevention
- **Screen Readers**: Proper labels, counts announced for badges

## Responsive Behavior

### Mobile (< 640px)

- Breadcrumbs collapse to show only the last item with a back button
- Tabs scroll horizontally with touch/swipe support
- Actions stack below tabs (if both exist)

### Desktop (≥ 640px)

- Full breadcrumb trail visible
- All tabs visible (if they fit)
- Actions remain on the same row as tabs

## Styling Notes

- Uses Tailwind v4 design tokens (`bg-background`, `text-foreground`, etc.)
- Fully compatible with `next-themes` for dark mode
- Gradient background matches Vehicles page exactly
- Hover states use `hover:bg-muted/50` for subtle interaction
- Active state uses `shadow` for depth (from shadcn TabsTrigger)

## Integration with Existing Pages

This component is designed to replace inline tab/breadcrumb implementations. No pages have been modified yet—refactoring should be done incrementally:

1. Import `TopNav` at the page level
2. Replace existing navigation markup with `<TopNav />`
3. Pass appropriate props based on page requirements
4. Test keyboard navigation and responsive behavior
5. Verify WCAG 2.2 AA compliance

## Performance

- Pure presentational component (no data fetching)
- Client-side only due to keyboard event handlers
- Minimal re-renders (uses React refs for DOM access)
- Scrollable areas use CSS `scrollbar-thin` for performance

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires CSS Grid and Flexbox support
- Touch-friendly for mobile devices
