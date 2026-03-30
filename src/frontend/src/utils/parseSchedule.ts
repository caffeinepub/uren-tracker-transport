import type { DayEntry } from "../types";

// Dutch day name variants -> day of week (0=Sun, 1=Mon … 6=Sat)
const DAY_PATTERNS: { day: number; patterns: RegExp }[] = [
  { day: 1, patterns: /\b(maandag|maan)\b|\bma\b/i },
  { day: 2, patterns: /\b(dinsdag|dins)\b|\bdi\b/i },
  { day: 3, patterns: /\b(woensdag|woens)\b|\bwo\b/i },
  { day: 4, patterns: /\b(donderdag|dond)\b|\bdo\b/i },
  { day: 5, patterns: /\b(vrijdag|vrij)\b|\bvr\b/i },
  { day: 6, patterns: /\b(zaterdag|zat)\b|\bza\b/i },
  { day: 0, patterns: /\b(zondag|zon)\b|\bzo\b/i },
];

// Break pattern: common Dutch keywords
const BREAK_RE =
  /pauze[:\s]*(\d+)\s*(min|minuten)?|pause[:\s]*(\d+)\s*(min)?|(\d+)\s*(min|minuten)\s*pauze/i;

export interface ParsedDay {
  dayOfWeek: number; // 0=Sun … 6=Sat
  entry: DayEntry;
  rawLine: string;
}

/**
 * Check whether a position in the string is part of a date pattern like 24-03 or 24/3.
 */
function isDateContext(
  line: string,
  matchStart: number,
  matchEnd: number,
): boolean {
  const before = line.slice(0, matchStart);
  const after = line.slice(matchEnd);
  if (/\d[-/]$/.test(before)) return true;
  if (/^[-/]\d/.test(after)) return true;
  return false;
}

/**
 * Extract valid times (HH:MM or H.MM) from a single line.
 * Skips patterns that are part of date contexts (like 24-03).
 */
function extractTimes(line: string): string[] {
  // Mask date patterns so they don't get picked up as times
  const masked = line.replace(/(\d{1,2})[-/](\d{1,2})/g, (_, a, b) => {
    return `${"X".repeat(a.length)}-${"X".repeat(b.length)}`;
  });

  const results: string[] = [];
  const re = /(?<![\d])(\d{1,2})[:.](\d{2})(?![\d])/g;
  let m = re.exec(masked);
  while (m !== null) {
    const h = Number.parseInt(m[1], 10);
    const min = Number.parseInt(m[2], 10);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      if (!isDateContext(line, m.index, m.index + m[0].length)) {
        results.push(
          `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
        );
      }
    }
    m = re.exec(masked);
  }
  return results;
}

/**
 * Find break minutes from a line, default 30 min.
 */
function extractBreak(line: string): number {
  const m = BREAK_RE.exec(line);
  if (m) {
    const raw = m[1] ?? m[3] ?? m[5];
    const val = Number.parseInt(raw, 10);
    if (!Number.isNaN(val) && val >= 0 && val <= 120) return val;
  }
  return 30;
}

/**
 * Check if a line contains a Dutch day name.
 */
function detectDayInLine(line: string): number | null {
  const lineLow = line.toLowerCase();
  for (const dp of DAY_PATTERNS) {
    if (dp.patterns.test(lineLow)) {
      return dp.day;
    }
  }
  return null;
}

/**
 * Parse OCR text into day entries.
 *
 * Strategy:
 * 1. Find lines that contain a day name.
 * 2. Try to extract 2 times from THAT line only.
 * 3. If fewer than 2 times found, look at the very next line only.
 * 4. Stop collecting once we've seen ≥1 day entry and then hit 3+ consecutive
 *    lines with no day name (= we've left the header block).
 */
export function parseScheduleText(text: string): ParsedDay[] {
  const lines = text
    .split(/\n|\r/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: ParsedDay[] = [];
  const seen = new Set<number>();

  let consecutiveNonDayLines = 0;
  let foundAtLeastOne = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matchedDay = detectDayInLine(line);

    if (matchedDay === null) {
      if (foundAtLeastOne) {
        consecutiveNonDayLines++;
        if (consecutiveNonDayLines >= 3) break;
      }
      continue;
    }

    consecutiveNonDayLines = 0;

    if (seen.has(matchedDay)) continue;

    // Phase 2: try same line first
    let times = extractTimes(line);
    let usedNextLine = false;

    // If fewer than 2 times on current line, try the next line only
    if (times.length < 2 && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (detectDayInLine(nextLine) === null) {
        const nextTimes = extractTimes(nextLine);
        times = [...times, ...nextTimes];
        usedNextLine = true;
      }
    }

    if (times.length < 2) continue;

    const startTime = times[0];
    const endTime = times.find((t) => t !== startTime) ?? times[1];
    if (!startTime || !endTime || startTime === endTime) continue;

    // Break: only from same line (+ next line if we used it)
    const breakContext = usedNextLine ? `${line} ${lines[i + 1]}` : line;
    let breakMinutes = 30;
    if (/pauze|pause/i.test(breakContext)) {
      breakMinutes = extractBreak(breakContext);
    }

    seen.add(matchedDay);
    foundAtLeastOne = true;
    consecutiveNonDayLines = 0;

    results.push({
      dayOfWeek: matchedDay,
      entry: { startTime, endTime, breakMinutes },
      rawLine: line,
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
