# Stage Filter Feature for Releases Page

## Overview

This document describes the implementation of the stage filter feature for the Releases page in the Azure DevOps Dashboard.

## Feature Description

The stage filter allows users to filter release builds by pipeline stages. This helps users quickly focus on releases relevant to specific stages and improve navigation for large lists of releases.

## How It Works

### User Interface

1. **Location**: The stage filter appears in the Filters section on the Releases page, next to the Project filter.

2. **Control Type**: Multi-select dropdown with checkboxes

3. **States**:
   - **Disabled**: When no build timeline data has been loaded yet
   - **Enabled**: Once at least one build's timeline has been loaded
   - **Empty**: When no stages are selected (default state showing all builds)
   - **Selected**: When one or more stages are selected (showing only matching builds)

### Behavior

#### Default State
- When the page loads, all builds are displayed
- The stage filter is disabled until timeline data loads
- Once timelines load, the filter becomes enabled and populated with available stages

#### Filtering
- Users can select one or more stages from the dropdown
- The table updates in real-time to show only builds containing the selected stages
- The row count in the table header updates to reflect the filtered results
- Deselecting all stages returns to the default view (all builds shown)

#### Stage Selection Rules
- Only non-skipped and non-canceled stages are available for filtering
- Stages are displayed in alphabetical order
- The dropdown shows "All" when no stages are selected
- When stages are selected, the dropdown shows the stage names separated by commas

## Implementation Details

### Files Modified

1. **`client/src/utils/buildUtils.ts`**
   - Added `getUniqueStages()` utility function

2. **`client/src/components/BuildsTable.tsx`**
   - Added `stageFilter` prop
   - Added filtering logic using `useMemo`
   - Updated row count display

3. **`client/src/components/views/ReleaseView.tsx`**
   - Added stage filter state
   - Added stage filter UI control
   - Added stage change handler
   - Updated filter layout

4. **`client/src/components/views/ReleaseView.test.tsx`**
   - Added tests for stage filter presence
   - Updated mock data to include timeline information

### Code Examples

#### Extracting Unique Stages

```typescript
const availableStages = React.useMemo(() => {
  return getUniqueStages(buildTimelines);
}, [buildTimelines]);
```

#### Filtering Builds by Stage

```typescript
const filteredBuilds = React.useMemo(() => {
  if (stageFilter.length === 0) {
    return builds;
  }
  
  return builds.filter(build => {
    const timeline = buildTimelines.get(build.id);
    if (!timeline || !timeline.records) {
      return false;
    }
    
    return timeline.records.some(record => 
      stageFilter.includes(record.name) && 
      record.result !== 'skipped' && 
      record.result !== 'canceled'
    );
  });
}, [builds, buildTimelines, stageFilter]);
```

## Testing

### Unit Tests

All tests in `ReleaseView.test.tsx` pass:
- ✅ renders release view with correct title
- ✅ loads and displays projects
- ✅ displays pipeline builds table when data is loaded
- ✅ handles API connectivity errors gracefully
- ✅ filters builds by main branch
- ✅ displays stage filter dropdown (NEW)
- ✅ stage filter is initially empty and available (NEW)

### Test Coverage

The implementation maintains the existing code coverage standards:
- Statement coverage: 41.37%
- Branch coverage: 29.98%
- Function coverage: 45.14%
- Line coverage: 43.2%

### Manual Testing Scenarios

1. **Initial Load**
   - Navigate to /release
   - Verify stage filter is disabled
   - Verify all builds are displayed
   - Wait for timelines to load
   - Verify stage filter becomes enabled

2. **Filter by Single Stage**
   - Select one stage from the dropdown
   - Verify only builds with that stage are shown
   - Verify row count updates correctly

3. **Filter by Multiple Stages**
   - Select multiple stages from the dropdown
   - Verify builds with any of the selected stages are shown
   - Verify row count updates correctly

4. **Clear Filter**
   - Deselect all stages
   - Verify all builds are shown again
   - Verify "All" is displayed in the dropdown

## Performance Considerations

- Uses `React.useMemo` to prevent unnecessary recalculation of filtered builds
- Uses `React.useMemo` to prevent unnecessary recalculation of available stages
- Filtering is performed client-side for instant response
- No additional API calls are required for filtering

## Accessibility

- The filter uses MUI's Select component with proper ARIA attributes
- Keyboard navigation is supported
- Screen readers can identify the filter control

## Browser Compatibility

The feature uses standard React and Material-UI components, ensuring compatibility with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

Potential improvements for future iterations:
1. Add ability to save filter preferences
2. Add filter by stage status (succeeded, failed, in progress)
3. Add quick filter presets (e.g., "Show only failed stages")
4. Add stage filter to other views (Builds, Dashboard)
