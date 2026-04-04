# Uren Tracker Transport

## Current State
De app berekent per week bruto loon, meerwerk (extra verdiend via meerurentoeslag, zaterdag/zondag toeslagen, nachttoeslag) en netto basisloon. Per week wordt het bruto totaal opgeslagen in `yearIncome`. In `WeekExtraCard` wordt het meerwerk van die week getoond. Er is geen cumulatief 4-weken meerwerk overzicht.

## Requested Changes (Diff)

### Add
- Aparte opslag van meerwerk (`extraPay`) per week in `useWeekData` (naast bestaand bruto totaal)
- Functie `addWeekExtraPay(weekNum, year, extraPay)` en `getWeekExtraIncomes()` in `useWeekData`
- Cumulatief meerwerk overzicht in `WeekExtraCard`: per week het meerwerk optellen over de huidige 4-weken periode
- Bij de laatste week van de periode (week 4): eindtotaal tonen van cumulatief meerwerk + netto basisloon

### Modify
- `App.tsx`: meerwerk (extraPay) per week doorgeven aan `addWeekExtraPay` (naast bestaand `addWeekIncome`)
- `WeekExtraCard.tsx`: nieuwe sectie "Periode totaal" toevoegen onderaan, met:
  - Per week het meerwerk in de huidige 4-weken periode
  - Cumulatief optopend totaal
  - Bij week 4: prominente display van totaal meerwerk + netto basisloon
- Props uitbreiden: `weekExtraIncomes`, `currentPeriodWeeks`, `isLastWeekOfPeriod`, `netBasePay4Weeks`

### Remove
- Niets verwijderen

## Implementation Plan
1. `useWeekData.ts`: voeg `WEEK_EXTRA_KEY` storage toe, `addWeekExtraPay` en `getAllWeekExtraIncomes` functies
2. `App.tsx`: importeer `addWeekExtraPay`/`getAllWeekExtraIncomes`, sla meerwerk op naast bruto, bereken welke weken in de huidige 4-weken periode vallen, geef dit door aan `WeekExtraCard`
3. `WeekExtraCard.tsx`: accepteer nieuwe props, render "Periode Meerwerk" sectie onderaan de card
