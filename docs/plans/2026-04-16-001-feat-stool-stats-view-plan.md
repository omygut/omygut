---
title: "feat(history): add date range selector for stool records"
type: feat
status: active
date: 2026-04-16
---

# feat(history): add date range selector for stool records

## Overview

Add date range query capability to services and a time range selector UI to the history page for stool records. This is the foundation for the stool statistics feature.

## Problem Frame

Users want to view stool statistics over time. This issue provides the data query method and UI controls for selecting time periods.

## Requirements Trace

- R1. Add `getByDateRange(startDate, endDate)` method to base service
- R2. Add tab switcher (记录 | 统计) to history page, only for stool category
- R3. Add time range selector in stats view (7天 | 30天 | 90天 | 自定义)
- R4. Custom date range uses existing CalendarPopup component

## Scope Boundaries

- Stats view shows placeholder for now (chart in #157)
- No score calculation (see #156)
- Only stool category gets the stats view

## Context & Research

### Relevant Code and Patterns

- `src/services/base.ts` - base service with `getRecentBefore` method
- `src/pages/history/index.tsx` - history page to modify
- `src/components/CalendarPopup/` - reusable calendar for date selection

## Key Technical Decisions

- **Tab switcher only for stool**: Other record types don't have stats yet
- **Reuse CalendarPopup**: Existing component for custom date selection

## Implementation Units

- [ ] **Unit 1: Add date range query to base service**

  **Goal:** Enable querying records within a date range

  **Requirements:** R1

  **Dependencies:** None

  **Files:**
  - Modify: `src/services/base.ts`
  - Test: `src/services/stool.test.ts`

  **Approach:**
  - Add `getByDateRange(startDate: string, endDate: string)` method
  - Query where `date >= startDate AND date <= endDate`, ordered by date desc

  **Patterns to follow:**
  - Existing `getRecentBefore` method in base service

  **Test scenarios:**
  - Happy path: Returns records within date range, ordered by date desc
  - Edge case: Returns empty array when no records in range
  - Edge case: Includes records on boundary dates (start and end)

  **Verification:**
  - Integration test passes for date range queries

- [ ] **Unit 2: Add tab switcher and stats view skeleton**

  **Goal:** Enable switching between Records and Stats views for stool category

  **Requirements:** R2, R3, R4

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `src/pages/history/index.tsx`
  - Modify: `src/pages/history/index.css`

  **Approach:**
  - Add state: `viewMode: 'records' | 'stats'` (default: 'records')
  - When `selectedType === 'stool'`, show tab switcher below type filter
  - Tab switcher: `[ 记录 | 统计 ]`
  - Stats view contains:
    - Time range buttons: 7天 | 30天 | 90天 | 自定义
    - Custom range: two CalendarPopup for start/end dates
    - Placeholder text: "图表开发中..." (to be replaced in #157)
  - Reset to 'records' view when switching to other record types

  **Patterns to follow:**
  - Existing type filter tabs styling
  - CalendarPopup usage in stool add page

  **Test scenarios:**
  - Test expectation: none -- UI behavior tested via E2E

  **Verification:**
  - Tab switcher appears only for stool category
  - Switching tabs shows correct view
  - Time range buttons update selected state
  - Custom date pickers work correctly
  - Switching record type resets to records view

## System-Wide Impact

- **State lifecycle risks:** View mode state should reset when record type changes
- **Unchanged invariants:** Other record types behavior unchanged

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Date range query performance | Index on date field should handle reasonable ranges |

## Sources & References

- Related issue: #154
- Follow-up issues: #156 (score calculation), #157 (bar chart)
