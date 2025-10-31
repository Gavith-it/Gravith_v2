# Sites Feature

This folder contains all components related to the site management feature in Gavith Build.

## Structure

```
sites/
├── README.md                    # This file
├── SiteDetailPage.tsx           # Main site detail page component
└── site-detail-columns.tsx      # Column definitions for site-specific tables
```

## Components

### SiteDetailPage

The main component that displays comprehensive site information with tabbed navigation.

**Features:**

- Site header with name, location, and status
- Budget and progress overview cards
- Tabbed interface with the following sections:
  - **Overview**: Project description, location, timeline, and cost summary
  - **Purchases**: Material purchases filtered for the site
  - **Expenses**: All expenses incurred at the site
  - **Vehicles**: Vehicles and equipment deployed at the site
  - **Labour**: Workforce and labor costs for the site
  - **Work Progress**: Activities and their progress status

**Props:**

- `siteId: string` - The ID of the site to display

### site-detail-columns.tsx

Exports column definition functions for all site-specific DataTables:

- `getSitePurchaseColumns()` - Columns for purchase table
- `getSiteExpenseColumns()` - Columns for expense table
- `getSiteVehicleColumns()` - Columns for vehicle/equipment table
- `getSiteLabourColumns()` - Columns for labour/workforce table
- `getSiteWorkProgressColumns()` - Columns for work progress/activities table

Each column definition includes:

- Sortable configuration
- Custom renderers with icons and badges
- Action buttons (view, edit, delete)
- Responsive design with minimum widths

## Routes

- `/sites` - Sites list page (see `src/app/sites/page.tsx`)
- `/sites/[id]` - Site detail page (see `src/app/sites/[id]/page.tsx`)
- `/sites/[id]/edit` - Edit site page (see `src/app/sites/[id]/edit/page.tsx`)
- `/sites/new` - Create new site page (see `src/app/sites/new/page.tsx`)

## Data Flow

Currently using mock data defined within `SiteDetailPage.tsx`. In production:

1. Data should be fetched from API using the `siteId` parameter
2. Each tab's data should be filtered by `siteId` on the backend
3. Forms should include the `siteId` when creating/updating records
4. All mutations should be tenant-scoped using `organizationId` from auth context

## Styling

- Uses shadcn/ui components for consistency
- Follows the project's color scheme with status-based variants
- Responsive design with mobile-first approach
- Icon-first design for better visual hierarchy

## Accessibility

- All action buttons include `aria-label` attributes
- Tooltips provide additional context
- Keyboard navigation supported on all interactive elements
- Status indicators use both color and icons (not color-alone)

## Future Enhancements

- [ ] Add real-time data fetching from API
- [ ] Implement search and advanced filtering on each tab
- [ ] Add export functionality (PDF/Excel) for reports
- [ ] Implement bulk actions for table items
- [ ] Add charts and visualizations for progress tracking
- [ ] Implement file attachments for expenses and purchases
- [ ] Add activity feed/timeline for site events
- [ ] Implement notifications for important site updates

## Testing

When testing this component:

1. Verify all tabs load correctly
2. Test table sorting and pagination on each tab
3. Ensure "Add" buttons open correct dialogs
4. Verify edit/delete actions work properly
5. Check responsive behavior on mobile devices
6. Test keyboard navigation and screen reader compatibility
