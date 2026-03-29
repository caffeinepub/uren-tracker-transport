import type { DayEntry } from "../types";

// Dutch day name variants
const DAY_PATTERNS: { day: number; patterns: RegExp }[] = [
  { day: 1, patterns: /\b(maandag|ma\.?|maan)\b/i },
  { day: 2, patterns: /\b(dinsdag|di\.?|dins)\b/i },
  { day: 3, patterns: /\b(woensdag|wo\.?|woens)\b/i },
  { day: 4, patterns: /\b(donderdag|do\.?|dond)\b/i },
  { day: 5, patterns: /\b(vrijdag|vr\.?|vrij)\b/i },
  { day: 6, patterns: /\b(zaterdag|za\.?|zat)\b/i },
  { day: 0, patterns: /\b(zondag|zo\.?|zon)\b/i },
];

// Time pattern: matches HH:MM or H:MM (also HH.MM)
const TIME_RE = /(\d{1,2})[:.](\d{2})/g;

// Break pattern: common Dutch keywords for breaks
const BREAK_RE =
  /pauze[:\s]*(\d+)\s*(min|minuten)?|pause[:\s]*(\d+)\s*(min)?|(\d+)\s*(min|minuten)\s*pauze/i;

export interface ParsedDay {
  dayOfWeek: number; // 0=Sun … 6=Sat
  entry: DayEntry;
  rawLine: string;
}

/**
 * Tries to extract times from a text line.
 * Returns array of "HH:MM" strings.
 */
function extractTimes(line: string): string[] {
  const results: string[] = [];
  // Reset regex
  const re = new RegExp(TIME_RE.source, "g");
  let m = re.exec(line);
  while (m !== null) {
    const h = Number.parseInt(m[1], 10);
    const min = Number.parseInt(m[2], 10);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      results.push(
        `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      );
    }
  }
  return results;
}

/**
 * Tries to find break minutes on a line.
 */
function extractBreak(line: string): number {
  const m = BREAK_RE.exec(line);
  if (m) {
    const raw = m[1] ?? m[3] ?? m[5];
    const val = Number.parseInt(raw, 10);
    if (!Number.isNaN(val) && val >= 0 && val <= 120) return val;
  }
  return 30; // default 30 min pauze
}

/**
 * Parse OCR text into day entries.
 * Returns map: dayOfWeek (0-6) -> DayEntry
 */
export function parseScheduleText(text: string): ParsedDay[] {
  const lines = text
    .split(/\n|\r/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: ParsedDay[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLow = line.toLowerCase();

    // Find day of week in this line
    let matchedDay: number | null = null;
    for (const dp of DAY_PATTERNS) {
      if (dp.patterns.test(lineLow)) {
        matchedDay = dp.day;
        break;
      }
    }

    if (matchedDay === null) continue;
    if (seen.has(matchedDay)) continue; // only first occurrence per day

    // Try to extract times from this line and the next 2 lines
    const contextLines = lines.slice(i, i + 3);
    const contextText = contextLines.join(" ");
    const times = extractTimes(contextText);

    if (times.length < 2) continue; // need at least start + end

    // First two non-equal times are start and end
    const startTime = times[0];
    const endTime = times.find((t) => t !== startTime) ?? times[1];
    if (!startTime || !endTime || startTime === endTime) continue;

    // Extract break from context
    const breakMinutes = extractBreak(contextText);

    seen.add(matchedDay);
    results.push({
      dayOfWeek: matchedDay,
      entry: { startTime, endTime, breakMinutes },
      rawLine: contextLines[0],
    });
  }

  return results;
}

/**
 * Given parsed days and the week dates array, return dateKey -> DayEntry map.
 */
export function mapParsedDaysToWeek(
  parsedDays: ParsedDay[],
  weekDates: Date[],
): Record<string, DayEntry> {
  const result: Record<string, DayEntry> = {};
  for (const parsed of parsedDays) {
    const date = weekDates.find((d) => d.getDay() === parsed.dayOfWeek);
    if (date) {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      result[key] = parsed.entry;
    }
  }
  return result;
}
