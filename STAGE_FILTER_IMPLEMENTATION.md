# Stage Filter Feature Implementation Summary

## Overview
Added a new stage filter feature to the Releases page that allows users to filter release builds by pipeline stages.

## Changes Made

### 1. Utility Function (`buildUtils.ts`)
- Added `getUniqueStages()` function to extract unique stage names from build timelines
- Filters out skipped and canceled stages
- Returns sorted array of stage names

### 2. BuildsTable Component (`BuildsTable.tsx`)
- Added optional `stageFilter` prop (array of stage names)
- Implemented `filteredBuilds` memo that filters builds based on selected stages
- When stage filter is active:
  - Only shows builds that have at least one matching stage
  - Hides builds without timeline data
  - Updates row count in the table header

### 3. ReleaseView Component (`ReleaseView.tsx`)
- Added `stageFilter` state to track selected stages
- Added `availableStages` computed value that extracts unique stages from loaded timelines
- Added multi-select dropdown UI control for stage filtering:
  - Label: "Stage"
  - Displays checkboxes for each available stage
  - Shows "All" when no stages selected
  - Shows comma-separated list when stages are selected
  - Disabled when no stages are available
- Updated grid layout from single column to 2 columns (Project and Stage filters)
- Passes `stageFilter` to BuildsTable component

### 4. Tests (`ReleaseView.test.tsx`)
- Added mock timeline data with sample stages (Build, Test)
- Added test to verify stage filter dropdown is displayed
- Added test to verify stage filter presence and functionality
- All 7 tests passing (5 existing + 2 new)

## User Experience

### Default Behavior
- When page loads, all builds are displayed (no filter applied)
- Stage filter dropdown is initially disabled until timeline data loads
- Once timelines load, dropdown becomes enabled and shows available stages

### Filtering Behavior
- User can select one or more stages from the dropdown
- Table updates in real-time to show only builds containing selected stages
- Row count updates to reflect filtered results
- Selecting no stages shows all builds (default view)

### Visual Layout
```
┌─────────────────────────────────────────────────┐
│ Release                                          │
├─────────────────────────────────────────────────┤
│ Filters                                          │
│ ┌────────────────┐  ┌────────────────┐         │
│ │ Project ▼      │  │ Stage ▼        │         │
│ └────────────────┘  └────────────────┘         │
└─────────────────────────────────────────────────┘
```

## Technical Details

### Stage Extraction Logic
- Iterates through all build timelines
- Collects stage names from timeline records
- Filters out skipped/canceled stages
- Returns alphabetically sorted unique list

### Filtering Logic
- When stageFilter is empty: shows all builds
- When stageFilter has values:
  - Checks if build has timeline data
  - Checks if any timeline record matches selected stages
  - Excludes skipped/canceled stages from matching
  - Only shows builds with matching stages

### Performance Considerations
- Uses `React.useMemo` for filtered builds to avoid unnecessary recalculation
- Uses `React.useMemo` for available stages to avoid unnecessary recalculation
- Filtering happens client-side for instant response

## Acceptance Criteria Met

✅ Filter control available after stage data is loaded
✅ Users can select one or more stages
✅ Only rows matching selected stages are shown
✅ Filter updates in real-time as selection changes
✅ Default view displays all rows (no filter applied)

## Code Quality

- Minimal changes to existing code
- No breaking changes to existing functionality
- All existing tests pass
- New tests added for new functionality
- TypeScript types properly maintained
- Follows existing code patterns and conventions
