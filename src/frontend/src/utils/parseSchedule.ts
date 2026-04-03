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
 * Parsed result for a single day from a monthly schedule.
 */
export interface ParsedMonthlyDay {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakMinutes: number;
}

/**
 * Extract valid times (HH:MM format) from a string.
 * Masks date patterns first to avoid false matches.
 */
function extractTimesStrict(line: string): string[] {
  // Mask date patterns like 24-03-2026 or 24/03 so they don't match as times
  const masked = line.replace(
    /(\d{1,2})[\-\/](\d{1,2})(?:[\-\/]\d{2,4})?/g,
    (match) => "X".repeat(match.length),
  );

  const results: string[] = [];
  const re = /(?<!\d)(\d{1,2})[:](\d{2})(?!\d)/g;
  let m = re.exec(masked);
  while (m !== null) {
    const h = Number.parseInt(m[1], 10);
    const min = Number.parseInt(m[2], 10);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      results.push(
        `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      );
    }
    m = re.exec(masked);
  }
  return results;
}

/**
 * Extract valid times (HH:MM or H.MM) from a single line.
 * Also handles dot-separated times like 6.00 or 14.30.
 */
function extractTimesLoose(line: string): string[] {
  const masked = line.replace(
    /(\d{1,2})[\-\/](\d{1,2})(?:[\-\/]\d{2,4})?/g,
    (match) => "X".repeat(match.length),
  );

  const results: string[] = [];
  // Match HH:MM and H.MM (dot-separated)
  const re = /(?<!\d)(\d{1,2})[:.](\d{2})(?!\d)/g;
  let m = re.exec(masked);
  while (m !== null) {
    const h = Number.parseInt(m[1], 10);
    const min = Number.parseInt(m[2], 10);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      results.push(
        `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      );
    }
    m = re.exec(masked);
  }
  return results;
}

/**
 * Find break minutes from a line, default 60 min.
 */
function extractBreak(line: string): number {
  const m = BREAK_RE.exec(line);
  if (m) {
    const raw = m[1] ?? m[3] ?? m[5];
    const val = Number.parseInt(raw, 10);
    if (!Number.isNaN(val) && val >= 0 && val <= 120) return val;
  }
  return 60;
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
 * Parse OCR text into day entries (weekly schedule).
 *
 * Strategy:
 * 1. Find lines that contain a day name.
 * 2. Try to extract 2 times from THAT line only.
 * 3. If fewer than 2 times found, look at the next 2 lines.
 * 4. Also try loose (dot-separated) time extraction.
 * 5. Stop collecting once we've seen ≥1 day entry and then hit 3+ consecutive
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
        if (consecutiveNonDayLines >= 4) break;
      }
      continue;
    }

    consecutiveNonDayLines = 0;

    if (seen.has(matchedDay)) continue;

    // Try strict HH:MM first on same line
    let times = extractTimesStrict(line);

    // If fewer than 2, try loose (dot) times
    if (times.length < 2) {
      times = extractTimesLoose(line);
    }

    let usedContext = line;

    // If still fewer than 2, look at next 2 lines
    if (times.length < 2) {
      const nextLines: string[] = [];
      for (let j = 1; j <= 3 && i + j < lines.length; j++) {
        const nextLine = lines[i + j];
        if (detectDayInLine(nextLine) !== null) break;
        nextLines.push(nextLine);
      }
      const combinedNext = nextLines.join(" ");
      const nextTimesStrict = extractTimesStrict(combinedNext);
      const nextTimesLoose = extractTimesLoose(combinedNext);
      const nextTimes =
        nextTimesStrict.length >= 2 ? nextTimesStrict : nextTimesLoose;
      times = [...times, ...nextTimes];
      usedContext = `${line} ${combinedNext}`;
    }

    if (times.length < 2) continue;

    const startTime = times[0];
    const endTime = times.find((t) => t !== startTime) ?? times[1];
    if (!startTime || !endTime || startTime === endTime) continue;

    let breakMinutes = 60;
    if (/pauze|pause/i.test(usedContext)) {
      breakMinutes = extractBreak(usedContext);
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

/**
 * Parse a Simon Loos maandelijkse urenbijlage text (from OCR or PDF).
 *
 * The table format has these columns:
 *   Datum | Soort | Omschrijving | Dienst | Tijd | Uren
 *
 * After OCR, rows may appear on 1 or 2 lines:
 *   Single line: "24-02-2026 Eendaags 06:00 14:30"
 *   Two lines:   "24-02-2026 Eendaags"
 *                "06:00-14:30" or "06:00 14:30"
 *
 * Also handles format where times appear as range: "06:00-14:30"
 *
 * Rules:
 * - Only rows with "Eendaags" or "Eendaags (D)" are treated as workdays.
 * - Rows with "Bijzondere uren" (vacation/leave) are ignored.
 * - Extract date from dd-mm-yyyy or dd/mm/yyyy or dd-mm patterns.
 * - Extract start/end time from "Tijd" column (HH:MM-HH:MM or two HH:MM values).
 * - Default 60 min break per day.
 */
export function parseMonthlyScheduleText(text: string): ParsedMonthlyDay[] {
  const lines = text
    .split(/\n|\r/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Sanity check: must look like a Simon Loos table (has at least some "Eendaags")
  const hasEendaags = lines.some((l) => /eendaags/i.test(l));
  if (!hasEendaags) return [];

  const results: ParsedMonthlyDay[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip rows explicitly marked as "Bijzondere uren" (vacation/leave)
    if (/bijzondere\s+uren/i.test(line)) continue;

    // Only process rows that contain "Eendaags" (with or without "(D)")
    if (!/eendaags/i.test(line)) continue;

    // Extract date: dd-mm-yyyy or dd/mm/yyyy or dd-mm
    const dateMatch =
      line.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/) ||
      line.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{2})/) ||
      line.match(/(\d{1,2})[\-\/](\d{1,2})/);

    if (!dateMatch) {
      // Date might be on the previous line when OCR splits rows
      // Try to find the date from surrounding lines (±1)
      const prevLine = i > 0 ? lines[i - 1] : "";
      const prevDateMatch =
        prevLine.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/) ||
        prevLine.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{2})/) ||
        prevLine.match(/(\d{1,2})[\-\/](\d{1,2})/);
      if (!prevDateMatch) continue;
      // Use the previous line's date but continue processing current line
      // (will be handled in the combined context below)
    }

    let year: number;
    let month: number;
    let day: number;

    // Try to get date from current line first
    const dm =
      line.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/) ||
      line.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{2})/) ||
      line.match(/(\d{1,2})[\-\/](\d{1,2})/);

    if (dm) {
      if (dm[3]) {
        day = Number.parseInt(dm[1], 10);
        month = Number.parseInt(dm[2], 10);
        year =
          dm[3].length === 2
            ? 2000 + Number.parseInt(dm[3], 10)
            : Number.parseInt(dm[3], 10);
      } else {
        day = Number.parseInt(dm[1], 10);
        month = Number.parseInt(dm[2], 10);
        year = new Date().getFullYear();
      }
    } else {
      // Fallback: date from prev line
      const prevLine = i > 0 ? lines[i - 1] : "";
      const pdm =
        prevLine.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/) ||
        prevLine.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{2})/) ||
        prevLine.match(/(\d{1,2})[\-\/](\d{1,2})/);
      if (!pdm) continue;
      if (pdm[3]) {
        day = Number.parseInt(pdm[1], 10);
        month = Number.parseInt(pdm[2], 10);
        year =
          pdm[3].length === 2
            ? 2000 + Number.parseInt(pdm[3], 10)
            : Number.parseInt(pdm[3], 10);
      } else {
        day = Number.parseInt(pdm[1], 10);
        month = Number.parseInt(pdm[2], 10);
        year = new Date().getFullYear();
      }
    }

    // Validate date components
    if (
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 2020 ||
      year > 2099
    ) {
      continue;
    }

    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Build a context window: current line + next 2 lines (for multi-line rows)
    const contextLines = [line];
    for (let j = 1; j <= 2 && i + j < lines.length; j++) {
      const nextLine = lines[i + j];
      // Stop if the next line contains another date (new row)
      if (/(\d{1,2})[\-\/](\d{1,2})[\-\/]\d{4}/.test(nextLine)) break;
      if (/eendaags|bijzondere/i.test(nextLine)) break;
      contextLines.push(nextLine);
    }
    const context = contextLines.join(" ");

    // Try to find a time range first: HH:MM-HH:MM or HH:MM–HH:MM
    const rangeMatch = context.match(
      /(?<!\d)(\d{1,2}):(\d{2})\s*[\-–]\s*(\d{1,2}):(\d{2})(?!\d)/,
    );
    if (rangeMatch) {
      const sh = Number.parseInt(rangeMatch[1], 10);
      const sm = Number.parseInt(rangeMatch[2], 10);
      const eh = Number.parseInt(rangeMatch[3], 10);
      const em = Number.parseInt(rangeMatch[4], 10);
      if (
        sh >= 0 &&
        sh <= 23 &&
        sm >= 0 &&
        sm <= 59 &&
        eh >= 0 &&
        eh <= 23 &&
        em >= 0 &&
        em <= 59
      ) {
        const startTime = `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`;
        const endTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        if (startMins !== endMins) {
          const span =
            endMins > startMins
              ? endMins - startMins
              : 24 * 60 - startMins + endMins;
          if (span <= 16 * 60) {
            results.push({
              date: dateStr,
              startTime,
              endTime,
              breakMinutes: 60,
            });
            continue;
          }
        }
      }
    }

    // Fallback: extract two individual times from context
    const times = extractTimesStrict(context);

    if (times.length < 2) {
      // Try with loose extraction (dot-separated times)
      const looseTimes = extractTimesLoose(context);
      if (looseTimes.length < 2) continue;
      const startTime = looseTimes[0];
      const endTime = looseTimes[1];
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      if (startMins === endMins) continue;
      const span =
        endMins > startMins
          ? endMins - startMins
          : 24 * 60 - startMins + endMins;
      if (span > 16 * 60) continue;
      results.push({ date: dateStr, startTime, endTime, breakMinutes: 60 });
      continue;
    }

    const startTime = times[0];
    const endTime = times[1];

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (startMins === endMins) continue;
    const span =
      endMins > startMins ? endMins - startMins : 24 * 60 - startMins + endMins;
    if (span > 16 * 60) continue;

    results.push({ date: dateStr, startTime, endTime, breakMinutes: 60 });
  }

  return results;
}

/**
 * Extract text from a PDF file using pdf.js loaded from CDN.
 * Returns the full text content of all pages.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    // Load pdf.js from CDN (dynamic import to avoid TypeScript module resolution)
    const pdfjsCdnUrl =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- CDN URL import, no type declarations available
    const pdfjs = await import(/* @vite-ignore */ pdfjsCdnUrl);
    const pdfjsLib = pdfjs.default ?? pdfjs;

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;

    const textParts: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      // Reconstruct lines by grouping items by Y position
      const items = textContent.items as Array<{
        str: string;
        transform: number[];
      }>;

      // Group text items by approximate Y position to reconstruct rows
      const yGroups = new Map<number, Array<{ x: number; str: string }>>();
      for (const item of items) {
        if (!item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        const x = Math.round(item.transform[4]);
        const yKey = Math.round(y / 2) * 2; // bucket by 2px
        if (!yGroups.has(yKey)) yGroups.set(yKey, []);
        yGroups.get(yKey)!.push({ x, str: item.str });
      }

      // Sort groups by Y descending (top of page first), then by X
      const sortedYKeys = Array.from(yGroups.keys()).sort((a, b) => b - a);
      for (const yKey of sortedYKeys) {
        const group = yGroups.get(yKey)!.sort((a, b) => a.x - b.x);
        const rowText = group.map((g) => g.str).join(" ");
        if (rowText.trim()) textParts.push(rowText);
      }
    }

    return textParts.join("\n");
  } finally {
    URL.revokeObjectURL(url);
  }
}
