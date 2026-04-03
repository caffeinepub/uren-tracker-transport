# Uren Tracker Transport

## Current State
Versionie 34 is live. De app heeft:
- CAO Beroepsgoederenvervoer 2026 loon-/overuren berekening
- Fiscale uitruil reiskosten sectie in Instellingen (basisimplementatie op basis van €0,23/km × 214 dagen)
- Scan/OCR importfunctie (ScanModal voor weekly, MaandScanModal voor monthly)
- Weeknummers worden getoond in het overzicht
- Netto loon weergave per week

## Requested Changes (Diff)

### Add
- CAO Beroepsgoederenvervoer specifieke uitruilberekening:
  - Eerste 10 km eigen rekening (geen vergoeding)
  - Alleen km 10-35 = max 25 km tellen voor CAO-vergoeding
  - Maximum CAO-vergoeding: 25 km × €0,23 = €5,75 per enkele reis
  - Fiscale uitruil: alle werkelijke kilometers (inclusief eerste 10 km en alles >35 km) onbelast vergoed via uitruil
  - Nacalculatie optie op jaarbasis op basis van werkelijke reisdagen
- Jaarlijkse nacalculatie knop/sectie voor fiscale uitruil

### Modify
- **Fiscale uitruil berekening in SettingsPage:** Vervang de huidige generieke berekening door de CAO-specifieke logica:
  - CAO vergoeding = max(0, min(enkeleReis, 35) - 10) × 2 × €0,23 × werkdagen
  - Uitruilruimte = (enkeleReis × 2 × €0,23 × werkdagen) - CAO vergoeding
  - Toon beide bedragen afzonderlijk met uitleg
- **Maandtotaal display (WeekTotals/App.tsx):** In het maandoverzicht NIET één totaalbedrag tonen, maar drie aparte regels:
  1. Netto basisloon
  2. Netto meerwerk (overuren + toeslagen na belasting)
  3. Uitruilen reiskosten (aparte post)
  Totaal netto = som van de drie
- **ScanModal + MaandScanModal (scan bug fix):** Zorg dat bij "Overnemen" de gescande tijden daadwerkelijk correct worden overgenomen in de weekdata. Voeg een expliciet jaarveld toe (dropdown/invoer) zodat de gebruiker het jaar kan bevestigen/corrigeren voordat de uren worden overgenomen.
- **Weeknummers (App.tsx + alle weergave-componenten):** Overal waar weeknummer getoond wordt (invoerscherm, overzicht, tabs) weergeven als "Week 14 – 2026" in plaats van alleen "Week 14".

### Remove
- Niets verwijderen

## Implementation Plan
1. Lees de huidige fiscale uitruil implementatie in SettingsPage.tsx
2. Update de uitruilberekening naar CAO Beroepsgoederenvervoer specifieke logica
3. Voeg in het maandoverzicht drie aparte regels toe voor netto loon / netto meerwerk / uitruilen
4. Fix de scan-overname bug in ScanModal en MaandScanModal; voeg jaar-invoerveld toe
5. Voeg overal jaar toe aan weeknummer weergave
6. Valideer en build
