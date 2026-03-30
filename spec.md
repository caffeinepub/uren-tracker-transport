# Uren Tracker Transport

## Current State
The app has CAO PDF upload in settings that extracts only percentages/values (uurloon, vakantiegeld, pensioen, toeslagen) and applies them to settings. There is no dedicated CAO viewer or article browser on the site.

## Requested Changes (Diff)

### Add
- New "CAO" tab in navigation (between Jaarprognose and Instellingen)
- `CaoTab.tsx` component with:
  - Hardcoded CAO 2026 reference articles for: loonberekening, vakantiedagen, pensioenopbouw, overuren, toeslagen
  - Search input to filter/find articles by keyword
  - If user has uploaded a CAO PDF, display the extracted full text as searchable sections
  - Clear labeling per article: article number, title, summary, relevant percentages/rules
- Enhanced CAO PDF parsing in SettingsPage: store the full extracted text in localStorage (key: `cao_full_text`) alongside the parsed values, so the CAO tab can display it

### Modify
- `App.tsx`: add `cao` tab type, add nav item, render `<CaoTab />`
- `SettingsPage.tsx`: after extracting percentages, also save full PDF text to localStorage under `cao_full_text` key

### Remove
- Nothing

## Implementation Plan
1. Create `CaoTab.tsx` with:
   - Hardcoded CAO 2026 Beroepsgoederenvervoer articles (loon, vakantie, pensioen, overuren, toeslagen, nachttoeslag)
   - Search bar that filters articles
   - Section for "Geüploade CAO" if `cao_full_text` is in localStorage, with text search
2. Update `SettingsPage.tsx` `handleApply` and the upload flow to also persist `cao_full_text` to localStorage
3. Update `App.tsx` to add the CAO tab
