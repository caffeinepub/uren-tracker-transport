/**
 * One-time data restore for previously entered hours.
 * Runs synchronously before the useWeekData hook initializes its state.
 * Guard flag 'dataRestored_v1' prevents double-restore on subsequent loads.
 */

const STORAGE_KEY = "trucktijden_week_data";
const RESTORE_FLAG = "dataRestored_v1";

interface DayEntryRestore {
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

const RESTORE_DATA: Record<string, DayEntryRestore> = {
  // Week 9, 2026
  "2026-02-23": { startTime: "09:25", endTime: "18:20", breakMinutes: 60 },
  "2026-02-25": { startTime: "08:22", endTime: "17:24", breakMinutes: 30 },
  "2026-02-27": { startTime: "08:33", endTime: "17:44", breakMinutes: 0 },
  "2026-02-28": { startTime: "08:19", endTime: "17:19", breakMinutes: 58 },
  // Week 10, 2026
  "2026-03-02": { startTime: "09:11", endTime: "18:19", breakMinutes: 60 },
  "2026-03-04": { startTime: "08:31", endTime: "17:49", breakMinutes: 30 },
  "2026-03-05": { startTime: "08:19", endTime: "18:17", breakMinutes: 30 },
  // Week 11, 2026
  "2026-03-09": { startTime: "08:29", endTime: "17:56", breakMinutes: 56 },
  "2026-03-11": { startTime: "08:19", endTime: "17:40", breakMinutes: 30 },
  "2026-03-12": { startTime: "08:32", endTime: "18:19", breakMinutes: 60 },
  "2026-03-15": { startTime: "06:13", endTime: "16:15", breakMinutes: 45 },
  // Week 13, 2026
  "2026-03-23": { startTime: "08:21", endTime: "18:26", breakMinutes: 63 },
  "2026-03-25": { startTime: "08:17", endTime: "17:49", breakMinutes: 90 },
  "2026-03-26": { startTime: "09:53", endTime: "18:19", breakMinutes: 43 },
  "2026-03-28": { startTime: "08:32", endTime: "18:12", breakMinutes: 60 },
  "2026-03-29": { startTime: "06:13", endTime: "13:16", breakMinutes: 37 },
  // Week 14, 2026
  "2026-03-30": { startTime: "08:28", endTime: "18:15", breakMinutes: 60 },
  "2026-04-01": { startTime: "08:52", endTime: "17:24", breakMinutes: 60 },
};

export function restoreUserData(): void {
  // Guard: already restored — skip entirely
  if (localStorage.getItem(RESTORE_FLAG)) return;

  // Read whatever data is already in localStorage
  let existing: Record<string, DayEntryRestore> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) existing = JSON.parse(raw) as Record<string, DayEntryRestore>;
  } catch {
    existing = {};
  }

  // Merge: only fill in dates that are completely missing or have no startTime
  let changed = false;
  for (const [dateKey, entry] of Object.entries(RESTORE_DATA)) {
    const current = existing[dateKey];
    if (!current || !current.startTime) {
      existing[dateKey] = entry;
      changed = true;
    }
  }

  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }

  // Mark as done — never run again
  localStorage.setItem(RESTORE_FLAG, "true");
}
