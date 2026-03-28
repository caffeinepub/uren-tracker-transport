# Uren Tracker Transport

## Current State
App calculates weekly earnings per CAO Beroepsgoederenvervoer 2026. The `calculateNetPay` function deducts pension, WIA-Hiaat, SOOB, WHK, and loonheffing from gross pay, but does NOT apply heffingskorting (tax credits). The Settings type has no fields for heffingskorting. The WeekTotals shows a "Netto schatting" line item without heffingskorting.

## Requested Changes (Diff)

### Add
- Two new fields in `Settings`: `algHeffingskorting: number` (annual €3068) and `arbeidskorting: number` (annual €5599)
- `calculateNetPay` now adds weekly heffingskorting credit back after deductions: `(algHeffingskorting + arbeidskorting) / 52`
- New line item in WeekTotals showing heffingskorting as a positive credit (green/positive)
- New settings fields in SettingsPage under a "Heffingskorting 2026" card, with explanation
- Add heffingskorting totals to CSV export

### Modify
- `types.ts`: add `algHeffingskorting` and `arbeidskorting` to Settings interface
- `useWeekData.ts`: add defaults algHeffingskorting: 3068, arbeidskorting: 5599
- `calculations.ts`: update `calculateNetPay` to factor in weekly heffingskorting
- `WeekTotals.tsx`: add heffingskorting display row in the totals grid
- `SettingsPage.tsx`: add new card for heffingskorting with editable fields and explanation table

### Remove
- Nothing removed

## Implementation Plan
1. Update `types.ts` to add the two new Settings fields
2. Update `useWeekData.ts` defaults
3. Update `calculateNetPay` in `calculations.ts` to add back `(algHeffingskorting + arbeidskorting) / 52` weekly credit
4. Add heffingskorting line item to `WeekTotals.tsx` items array (positive, highlighted green)
5. Add heffingskorting settings card in `SettingsPage.tsx` with explanation of the 2026 values and when they phase out
