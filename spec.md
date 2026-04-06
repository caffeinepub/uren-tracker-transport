# Uren Tracker Transport

## Current State
The app shows a period banner at the top of the week overview with:
- "Periode X 2026" with start and end dates of the current 4-week pay period
- A note that overtime/bonuses are paid in the next period
- Week labels show: "Week 14 – 2026: ma 1 apr – zo 7 apr"

The `getCurrentPeriod()` function in calculations.ts computes the period number based on an anchor date (Dec 29, 2025). Periods are 28-day blocks.

## Requested Changes (Diff)

### Add
- A utility function `getPeriodForWeek(weekNum, year)` that returns which period (1–13) a given ISO week belongs to: Periode 1 = weeks 1–4, Periode 2 = weeks 5–8, Periode 3 = weeks 9–12, etc.
- Period label appended to the week heading: "Week 14 – 2026 · Periode 4: 7 apr – 4 mei"
- In the period banner: show the week range (e.g., "week 1–4") alongside the date range

### Modify
- `weekLabel` in App.tsx: append the period number for the currently viewed week
- Period banner: add week number range ("week 1 t/m 4") in addition to dates

### Remove
- Nothing removed

## Implementation Plan
1. Add `getPeriodForWeek(weekNum: number, year: number): number` to calculations.ts — maps ISO week to period number (week 1-4 → 1, 5-8 → 2, etc.)
2. Add `getPeriodWeekRange(periodNumber: number): { startWeek: number, endWeek: number }` helper
3. In App.tsx: compute `weekPeriod = getPeriodForWeek(weekNum, currentWeekYear)` 
4. Update `weekLabel` to include `· Periode {weekPeriod}` after the year
5. Update period banner to show week range: "week 1 t/m 4" alongside the date range
