# Uren Tracker Transport

## Current State
The app calculates weekly earnings for a transport driver (CAO Beroepsgoederenvervoer 2026, 24h contract, 60% parttime). It already has:
- Correct overtime logic (weekdays only above 24h → 130%)
- Saturday always 150%, Sunday always 200%
- Basic detailed net pay breakdown (grossBase + grossDelayed)
- Premies: pensioen 10.16%, WIA 0.90%, SOOB 0.245%, Whk 0.52%
- Special rate 40.20% on delayed payments
- Fixed weekly heffingskorting (algHeffingskorting + arbeidskorting) / 52
- Year projection based on base hours
- Simulation card (basic)

## Requested Changes (Diff)

### Add
1. **Net pay range display** – instead of one exact number, show a range (e.g. €255 – €275) by applying ±5% variance on the delayed part
2. **Cumulative year income tracker** – stored in localStorage per year, accumulates weekly grossBase + grossDelayed. Show in a banner: "Dit jaar al verdiend: €XX.XXX" with remaining room in schijf 1 (€38.883 limit)
3. **Warning when cumulative income approaches €29.700** – at that point algemene heffingskorting starts phasing out. Show a yellow warning badge.
4. **Realistic heffingskorting phase-out** – replace fixed algHeffingskorting/arbeidskorting division by dynamic calculation based on estimated annual income (already partially in calcAlgHeffingskorting / calcArbeidskorting functions, but need to use cumulative actual income not just grossBase × 52)
5. **Keuzebudget toggle in Settings** – checkbox to enable/disable keuzebudget opbouw (affects display note only, not taxable income in current version)
6. **Payslip comparison feature** – a collapsible section in WeekTotals where user can enter actual payslip amounts (netto this period, netto next period) to compare with app estimate; difference shown clearly
7. **Improved simulation card** – add Saturday/Sunday hour simulation options with realistic net (incl. 40.20% special rate on weekend pay), show netto range

### Modify
1. **calculateDetailedNetPay** – use actual cumulative annual income (from localStorage) instead of just grossBase × 52 for heffingskorting phase-out calculations. This makes the net estimate much more accurate.
2. **Net pay display** – show range notation (low–high) for the delayed/next-period amount, using ±5% as margin
3. **Jaarprognose** – add a progress bar showing how far into schijf 1 (€38.883) the cumulative income is, plus warning at €29.700 threshold
4. **SimulationCard** – add extra fields for Saturday hours and Sunday hours simulation, compute realistic netto after 40.20% + premies on those amounts

### Remove
- Nothing removed

## Implementation Plan
1. Add `cumulativeIncome` tracking to `useWeekData`: store yearly cumulative gross per ISO week in localStorage; expose `getCumulativeIncome(upToWeek)` and `addWeekIncome(weekNum, amount)` helpers
2. Update `calculateDetailedNetPay` to accept optional `cumulativeAnnualGross` param and use it for heffingskorting calculations
3. Update `WeekTotals` to:
   - Pass cumulative income to detailed net pay
   - Show net range (±5% on delayed part)
   - Add payslip comparison collapsible section
   - Show cumulative banner with schijf 1 progress bar and €29.700 warning
4. Update `SimulationCard` to add za/zo hour inputs and realistic netto after 40.20%
5. Add keuzebudget toggle to `SettingsPage`
