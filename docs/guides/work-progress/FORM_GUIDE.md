# Work Progress Form - Visual Guide

## Form Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Add New Work Entry                          │
│           Record new work progress and material usage           │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  📜 SCROLLABLE CONTENT                     │  │
│  │                                                            │  │
│  │  ━━━━━━━━━━━━━ Basic Information ━━━━━━━━━━━━━           │  │
│  │                                                            │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐        │  │
│  │  │ Work Type          ▼│  │ Date               📅│        │  │
│  │  │ [Foundation]        │  │ [Select work date]  │        │  │
│  │  └─────────────────────┘  └─────────────────────┘        │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────┐        │  │
│  │  │ Site                                        ▼│        │  │
│  │  │ [Select site]                                │        │  │
│  │  └──────────────────────────────────────────────┘        │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────┐        │  │
│  │  │ Description                                  │        │  │
│  │  │ [Describe the work performed]                │        │  │
│  │  │                                              │        │  │
│  │  └──────────────────────────────────────────────┘        │  │
│  │                                                            │  │
│  │  ──────────────────────────────────────────────          │  │
│  │                                                            │  │
│  │  ━━━━━━━━━━━━━━━ Measurements ━━━━━━━━━━━━━━━           │  │
│  │                                                            │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐        │  │
│  │  │ Unit              ▼│  │ Total Quantity      │        │  │
│  │  │ [Cubic Meter (cum)] │  │ [0.00]              │        │  │
│  │  └─────────────────────┘  └─────────────────────┘        │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │Length (m)│  │Breadth(m)│  │Thickness │               │  │
│  │  │ [0.00]   │  │ [0.00]   │  │ [0.00]   │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  │                                                            │  │
│  │  ──────────────────────────────────────────────          │  │
│  │                                                            │  │
│  │  ━━━━━━━━━━━━ Material Consumption ━━━━━━━━━━━          │  │
│  │                                                            │  │
│  │  ┌────────────────────────────┐ ┌────────┐ ┌───┐        │  │
│  │  │ Select Material          ▼│ │Quantity│ │ + │        │  │
│  │  │ [Choose material...]      │ │ [0]    │ └───┘        │  │
│  │  └────────────────────────────┘ └────────┘              │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────┐        │  │
│  │  │ ℹ️ Balance Stock: 35 bags                    │        │  │
│  │  └──────────────────────────────────────────────┘        │  │
│  │                                                            │  │
│  │  Added Materials:                                         │  │
│  │  ┌──────────────────────────────────────────────┐        │  │
│  │  │ 🧱 Ordinary Portland Cement (OPC 53)       ✕│        │  │
│  │  │ Quantity: 50 bags | Balance after: 35 bags  │        │  │
│  │  └──────────────────────────────────────────────┘        │  │
│  │  ┌──────────────────────────────────────────────┐        │  │
│  │  │ 🔩 TMT Steel Bars (12mm)                   ✕│        │  │
│  │  │ Quantity: 2 nos | Balance after: 18 nos     │        │  │
│  │  └──────────────────────────────────────────────┘        │  │
│  │                                                            │  │
│  │  ──────────────────────────────────────────────          │  │
│  │                                                            │  │
│  │  ━━━━━━━━━━━━━ Labor & Progress ━━━━━━━━━━━━━          │  │
│  │                                                            │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐        │  │
│  │  │ Labor Hours        │  │ Progress Percentage│        │  │
│  │  │ [0]                │  │ [0]                 │        │  │
│  │  └─────────────────────┘  └─────────────────────┘        │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────┐        │  │
│  │  │ Status                                      ▼│        │  │
│  │  │ [In Progress]                                │        │  │
│  │  └──────────────────────────────────────────────┘        │  │
│  │                                                            │  │
│  │  ──────────────────────────────────────────────          │  │
│  │                                                            │  │
│  │  ━━━━━━━━━━━━━ Photo Attachments ━━━━━━━━━━━━━         │  │
│  │                                                            │  │
│  │  ┌────────────────────┐                                  │  │
│  │  │ 📤 Upload Photos   │                                  │  │
│  │  └────────────────────┘                                  │  │
│  │                                                            │  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐                           │  │
│  │  │ 📷   │  │ 📷   │  │ 📷   │                           │  │
│  │  │ img1 │  │ img2 │  │ img3 │                           │  │
│  │  │   ✕  │  │   ✕  │  │   ✕  │  (hover to delete)       │  │
│  │  └──────┘  └──────┘  └──────┘                           │  │
│  │                                                            │  │
│  │  ──────────────────────────────────────────────          │  │
│  │                                                            │  │
│  │  Additional Notes:                                        │  │
│  │  ┌──────────────────────────────────────────────┐        │  │
│  │  │ [Additional notes or observations]           │        │  │
│  │  │                                              │        │  │
│  │  └──────────────────────────────────────────────┘        │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                                     [ Cancel ]  [ Add Entry ]│
└─────────────────────────────────────────────────────────────┘
```

## Form Field Details

### 1. Basic Information Section

```
Work Type        : Dropdown with 8 options
                   • Foundation
                   • Plumbing
                   • Electrical
                   • Painting
                   • Roofing
                   • Flooring
                   • Masonry
                   • Plastering

Date            : Date picker component
                   • Calendar popup
                   • Manual date entry

Site            : Dropdown (site-specific)
                   • Rajiv Nagar Residential Complex
                   • Green Valley Commercial Center
                   • Sunshine Apartments Phase II

Description     : Multi-line text area (3 rows)
                   • Required field
                   • Free-form text entry
```

### 2. Measurements Section

```
Unit            : Dropdown with 6 options
                   • Cubic Meter (cum)
                   • Square Meter (sqm)
                   • Running Meter (rmt)
                   • Numbers (nos)
                   • Square Feet (sqft)
                   • Cubic Feet (cft)

Total Quantity  : Number input (required)
                   • Decimal support (step: 0.01)
                   • Example: 40.50

Length          : Number input (optional)
                   • In meters
                   • Decimal support

Breadth         : Number input (optional)
                   • In meters
                   • Decimal support

Thickness       : Number input (optional)
                   • In meters
                   • Decimal support
```

### 3. Material Consumption Section

```
Material Selection Row:
┌─────────────────────────────┬──────────┬────┐
│ Select Material           ▼ │ Quantity │ +  │
│ [Cement (Balance: 35 bags)] │   [50]   │    │
└─────────────────────────────┴──────────┴────┘

Balance Stock Info:
┌────────────────────────────────────────┐
│ ℹ️ Balance Stock: 35 bags              │
└────────────────────────────────────────┘

Added Materials List:
┌────────────────────────────────────────┐
│ 🧱 Ordinary Portland Cement (OPC 53) ✕│
│ Quantity: 50 bags                      │
│ Balance after: 35 bags                 │
└────────────────────────────────────────┘

States:
• No Site Selected
  ┌────────────────────────────────────┐
  │ ⚠️ Please select a site first to   │
  │    add materials                   │
  └────────────────────────────────────┘

• No Materials Available
  ┌────────────────────────────────────┐
  │ 📦 No materials available for this │
  │    site                            │
  └────────────────────────────────────┘

• Materials Available
  → Show material selection UI
```

### 4. Labor & Progress Section

```
Labor Hours     : Number input
                   • Decimal support (step: 0.5)
                   • Example: 40.5

Progress %      : Number input
                   • Range: 0-100
                   • Integer values

Status          : Dropdown with 3 options
                   • In Progress (blue badge)
                   • Completed (green badge)
                   • On Hold (yellow badge)
```

### 5. Photo Attachments Section

```
Upload Control:
┌────────────────────┐
│ 📤 Upload Photos   │  ← Styled label acting as button
└────────────────────┘
     (Hidden file input: accept="image/*", multiple)

Photo Grid (3 columns):
┌──────────┬──────────┬──────────┐
│  [IMG1]  │  [IMG2]  │  [IMG3]  │
│    ✕     │    ✕     │    ✕     │  ← Delete on hover
└──────────┴──────────┴──────────┘

Empty State:
┌────────────────────────────────────────┐
│          🖼️                            │
│  No photos attached. Upload images to  │
│  document work progress.               │
└────────────────────────────────────────┘
```

### 6. Additional Notes Section

```
Notes           : Multi-line text area (3 rows)
                   • Optional field
                   • Free-form text entry
                   • For observations and comments
```

## Validation Rules

### Required Fields

- ✅ Work Type
- ✅ Date
- ✅ Site
- ✅ Description
- ✅ Unit
- ✅ Total Quantity

### Optional Fields

- ⚪ Length
- ⚪ Breadth
- ⚪ Thickness
- ⚪ Materials
- ⚪ Labor Hours
- ⚪ Progress Percentage
- ⚪ Photos
- ⚪ Notes

### Business Rules

1. **Site Selection**: Must be selected before adding materials
2. **Material Quantity**: Cannot exceed available balance stock
3. **Progress Percentage**: Must be between 0-100
4. **Date**: Cannot be in the future (recommended)
5. **Photo Format**: Must be valid image file

## User Flow

### Creating New Work Entry

```
1. User clicks "New Entry" button
   ↓
2. Modal opens with empty form
   ↓
3. User fills Basic Information
   - Selects work type
   - Picks date
   - Selects site (triggers material availability)
   - Enters description
   ↓
4. User fills Measurements
   - Selects unit
   - Enters total quantity
   - Optionally enters dimensions
   ↓
5. User adds materials (if needed)
   - Selects material from dropdown
   - Enters quantity
   - Clicks "+" to add
   - Sees balance stock info
   - Repeat for multiple materials
   ↓
6. User fills Labor & Progress
   - Enters labor hours
   - Enters progress percentage
   - Selects status
   ↓
7. User uploads photos (optional)
   - Clicks "Upload Photos"
   - Selects one or more images
   - Sees preview thumbnails
   ↓
8. User adds notes (optional)
   - Enters additional observations
   ↓
9. User clicks "Add Entry"
   ↓
10. System validates and saves
    - Deducts materials from inventory
    - Creates work entry
    - Closes modal
    - Updates table
```

### Editing Existing Entry

```
1. User clicks edit icon on table row
   ↓
2. Modal opens with pre-filled form
   ↓
3. User modifies fields as needed
   ↓
4. User clicks "Update Entry"
   ↓
5. System updates entry and inventory
```

## Responsive Behavior

### Desktop (>1024px)

- Form: 2-column grid for paired fields
- Photos: 3-column grid
- Modal: max-w-4xl (896px)

### Tablet (768px-1024px)

- Form: 2-column grid maintained
- Photos: 3-column grid maintained
- Modal: max-w-4xl with padding

### Mobile (<768px)

- Form: Single column layout
- Photos: 2-column grid (stacked on very small)
- Modal: Full width with smaller padding
- ScrollArea: Increased importance

## Color Coding

### Status Badges

- 🟦 **In Progress**: Blue badge with dot
- 🟩 **Completed**: Green badge with dot
- 🟨 **On Hold**: Yellow badge with dot

### Information Cards

- 🔵 **Balance Stock Info**: Blue background with border
- ⚪ **Added Materials**: Muted background
- 🟡 **Empty States**: Muted background with icons

### Statistics Cards

- 🟣 **Total Entries**: Primary gradient
- 🟢 **Completed**: Green gradient
- 🔵 **In Progress**: Blue gradient
- 🟠 **Labor Hours**: Orange gradient

## Keyboard Navigation

- **Tab**: Move between fields
- **Shift+Tab**: Move backward
- **Enter**: Submit form (from last field)
- **Escape**: Close modal
- **Space**: Toggle dropdowns
- **Arrow Keys**: Navigate dropdown options

## Accessibility Features

- ✅ All inputs have visible labels
- ✅ Required fields indicated
- ✅ Error messages descriptive
- ✅ Focus visible on all controls
- ✅ Keyboard accessible
- ✅ Screen reader friendly
- ✅ Color is not sole indicator
- ✅ Touch targets sized appropriately

## Performance Considerations

- 📦 Form fields lazy load
- 🖼️ Images optimized with Next.js Image
- 📜 ScrollArea for large content
- 🔄 Efficient state updates
- ⚡ Minimal re-renders

## Best Practices Implemented

1. **Progressive Disclosure**: Show materials only after site selection
2. **Inline Validation**: Real-time stock checking
3. **Clear Feedback**: Balance stock displayed prominently
4. **Error Prevention**: Validation before submission
5. **Undo Support**: Remove materials/photos before submit
6. **Logical Grouping**: Related fields grouped together
7. **Visual Hierarchy**: Clear section headers
8. **Empty States**: Helpful guidance messages
9. **Confirmation Actions**: Clear primary action buttons
10. **Responsive Design**: Works on all screen sizes
