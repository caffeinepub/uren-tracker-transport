# Uren Tracker Transport

## Current State
The app has a CAO PDF upload/URL feature in SettingsPage.tsx that parses and extracts specific percentages (hourly rate, nachttoeslag, vacation pay, pension, Saturday/Sunday bonuses). The CAO tab (CaoTab.tsx) shows static article summaries and any full text from uploaded PDFs. The parser does NOT currently detect or extract loontabellen (wage scale tables).

## Requested Changes (Diff)

### Add
- **Loontabel parser**: In `parseCAOText()` in SettingsPage.tsx, add regex/table-detection logic that finds loontabel sections (look for patterns like "loongroep", "schaal", "functieschaal", "periodeloon", "uurloon" in tabular context, and rows with identifiers like A/B/C/D/E or numbers 1-15 followed by monetary amounts).
- **Loontabel display in CAO Upload card**: After parsing, if loontabellen are found, show them as a table UI below the other parsed values — columns: Schaal/Groep, Uurloon (€), Periodeloon (€ per 4 weken optionally). Add a "Selecteer" button per row so the user can pick their schaal and it sets the hourly wage in settings.
- **Loontabel display in CaoTab**: If loontabellen were extracted and saved (localStorage), show them in a dedicated "Loontabellen" section in the CAO tab, with the full table and a note about which schaal is currently active.
- **Persist loontabel data**: Save extracted loontabel rows to localStorage key `caoLoonTabel` so CaoTab can display them.

### Modify
- `parseCAOText()`: extend with loontabel detection.
- `CAOUploadCard`: show loontabel section in results UI.
- `CaoTab.tsx`: add Loontabellen section.

### Remove
- Nothing removed.

## Implementation Plan
1. In `SettingsPage.tsx`, extend `parseCAOText()` to detect loontabel blocks: scan for lines containing scale identifiers (D1–D6, A–F, schaal 1–12, etc.) followed by decimal amounts. Store as a separate `loonTabel: LoonTabelRow[]` array returned alongside `ParsedCAOValue[]`.
2. Update `CAOUploadCard` to receive and display `loonTabel` rows in a table with a "Selecteer" button per row that calls `onApply` with the hourly rate.
3. Save extracted table to localStorage `caoLoonTabel` on parse.
4. In `CaoTab.tsx`, read `caoLoonTabel` from localStorage and render a "Loontabellen" section with the full table, highlighting the currently active schaal (from settings hourlyRate).
