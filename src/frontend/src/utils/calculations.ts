import type { DayCalculation, DayEntry, Settings } from "../types";

export function calculateDay(
  entry: DayEntry,
  dayOfWeek: number, // 0=Sunday, 1=Monday, ..., 6=Saturday
  settings: Settings,
): DayCalculation {
  const empty: DayCalculation = {
    workedMinutes: 0,
    workedHours: 0,
    baseHours: 0,
    overtimeHours: 0,
    basePay: 0,
    overtimePay: 0,
    eveningNightPay: 0,
    nightHours: 0,
    dayOfWeekSupplement: 0,
    travelAllowance: 0,
    totalEarned: 0,
    toeslagPercentage: 0,
    hasData: false,
    vacationPayAccrual: 0,
    dayOfWeek,
  };

  if (!entry.startTime || !entry.endTime) return empty;

  const [startH, startM] = entry.startTime.split(":").map(Number);
  const [endH, endM] = entry.endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle overnight shifts
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const workedMinutes = endMinutes - startMinutes - entry.breakMinutes;
  if (workedMinutes <= 0) return empty;

  const workedHours = workedMinutes / 60;
  const rate = settings.hourlyRate;

  const isSat = dayOfWeek === 6;
  const isSun = dayOfWeek === 0;

  let basePay = 0;
  const overtimePay = 0;
  const dayOfWeekSupplement = 0;

  // Dagtoeslagen (CAO Beroepsgoederenvervoer 2026):
  // - Zaterdag: altijd 150% (alle uren op die dag)
  // - Zondag:   altijd 200% (alle uren op die dag)
  // - Ma-vr:    100% (overuren worden per week berekend, niet per dag)
  if (isSat) {
    basePay = workedHours * rate * (settings.saturdayPct / 100);
  } else if (isSun) {
    basePay = workedHours * rate * (settings.sundayPct / 100);
  } else {
    basePay = workedHours * rate * 1.0;
  }

  const breakFactor =
    entry.breakMinutes > 0
      ? workedMinutes / (workedMinutes + entry.breakMinutes)
      : 1;

  // Nacht-toeslag venster (configureerbaar, standaard 21:00-05:00)
  const nightStart = (settings.nightStartHour ?? 21) * 60;
  const nightEnd = (settings.nightEndHour ?? 5) * 60;

  let eveningMinutes = 0;
  let nightMinutes = 0;

  for (let m = startMinutes; m < endMinutes; m++) {
    const t = m % (24 * 60);
    const eveningWindowStart = 18 * 60;
    const isEvening =
      settings.eveningSupplementPct > 0 &&
      t >= eveningWindowStart &&
      t < nightStart;
    const isNight =
      nightStart > nightEnd
        ? t >= nightStart || t < nightEnd // bv. 21:00-05:00
        : t >= nightStart && t < nightEnd;
    if (isEvening) eveningMinutes++;
    if (isNight) nightMinutes++;
  }

  eveningMinutes = Math.round(eveningMinutes * breakFactor);
  nightMinutes = Math.round(nightMinutes * breakFactor);

  const eveningHours = eveningMinutes / 60;
  const nightHours = nightMinutes / 60;

  const eveningNightPay =
    eveningHours * rate * (settings.eveningSupplementPct / 100) +
    nightHours * rate * (settings.nightSupplementPct / 100);

  const travelAllowance = settings.travelAllowancePerDay;

  const vacationPayAccrual =
    (basePay + eveningNightPay) * (settings.vacationPayPct / 100);

  const totalEarned = basePay + eveningNightPay + travelAllowance;

  let toeslagPercentage = 0;
  if (isSat) toeslagPercentage = settings.saturdayPct - 100;
  else if (isSun) toeslagPercentage = settings.sundayPct - 100;

  return {
    workedMinutes,
    workedHours,
    baseHours: workedHours,
    overtimeHours: 0, // overtime is a weekly concept
    basePay,
    overtimePay,
    eveningNightPay,
    nightHours,
    dayOfWeekSupplement,
    travelAllowance,
    totalEarned,
    toeslagPercentage,
    hasData: true,
    vacationPayAccrual,
    dayOfWeek,
  };
}

/**
 * CAO-correcte verdeling van uren over categorieën:
 *
 * Stap 1: Tel alle uren op (na pauze): weekdag + zaterdag + zondag = totaal.
 * Stap 2: Overuren = max(0, totaal - 24).
 * Stap 3: Verdeel toeslagen:
 *   - Zaterdag: ALTIJD 150% (ook als binnen 24u contract).
 *   - Zondag:   ALTIJD 200% (ook als binnen 24u contract).
 *   - Weekend-uren vullen de 24u eerst op.
 *   - Weekdag normaal = max(0, 24 - satUren - zonUren), maar niet meer dan weekdagUren.
 *   - Weekdag overuren = weekdagUren - weekdag normaal  → krijgen +30% (totaal 130%).
 *   - Zaterdag/zondag krijgen NOOIT die extra +30% overurentoeslag.
 */
export function splitWeekHours(calculations: DayCalculation[]): {
  satHours: number;
  sunHours: number;
  weekdayHours: number;
  totalHours: number;
  weekdayNormalHours: number;
  weekdayOvertimeHours: number;
} {
  const satHours = calculations
    .filter((c) => c.dayOfWeek === 6)
    .reduce((s, c) => s + c.workedHours, 0);
  const sunHours = calculations
    .filter((c) => c.dayOfWeek === 0)
    .reduce((s, c) => s + c.workedHours, 0);
  const weekdayHours = calculations
    .filter((c) => c.dayOfWeek >= 1 && c.dayOfWeek <= 5)
    .reduce((s, c) => s + c.workedHours, 0);
  const totalHours = satHours + sunHours + weekdayHours;

  // Weekend-uren vullen de 24u contract eerst op.
  // Hoeveel contractruimte is er nog over voor weekdagen?
  const weekdayContractSlots = Math.max(0, 24 - satHours - sunHours);
  // Normaal (100%): weekdag-uren binnen contract
  const weekdayNormalHours = Math.min(weekdayHours, weekdayContractSlots);
  // Overuren (130%): weekdag-uren boven het contract
  const weekdayOvertimeHours = Math.max(0, weekdayHours - weekdayNormalHours);

  return {
    satHours,
    sunHours,
    weekdayHours,
    totalHours,
    weekdayNormalHours,
    weekdayOvertimeHours,
  };
}

/**
 * Berekent de +30% weekbonus op doordeweekse overuren.
 * Zaterdag- en zondaguren krijgen NOOIT deze bonus.
 */
export function calculateWeeklyOvertimeBonus(
  calculations: DayCalculation[],
  hourlyRate: number,
  bonusPct = 30,
): number {
  const { totalHours, weekdayOvertimeHours } = splitWeekHours(calculations);
  if (totalHours <= 24) return 0;
  return weekdayOvertimeHours * hourlyRate * (bonusPct / 100);
}

export interface WeekExtraResult {
  standardPay: number;
  extraPay: number;
  totalEarned: number;
  weekdayNormalHours: number;
  weekdayOvertimeHours: number;
  weekdayOvertimePay: number;
  saturdayHours: number;
  saturdayPay: number;
  sundayHours: number;
  sundayPay: number;
  nightPay: number;
  travelPay: number;
  weeklyBonus: number;
  totalHours: number;
  overtimeTriggered: boolean;
  // Legacy fields for backward compat
  overtimePay: number;
  toeslagenPay: number;
  weekendSupplementPay: number;
}

/**
 * Berekent wat je extra hebt verdiend boven je standaardloon (24u) deze week.
 * Inclusief gedetailleerde breakdown per categorie (zaterdag/zondag/overuren).
 *
 * Rekenregel (CAO Beroepsgoederenvervoer 2026, parttime 24u):
 *  - Zaterdag altijd 150%, zondag altijd 200% — geen extra 30%.
 *  - Weekend-uren tellen mee voor de 24u. Daarna pas +30% op doordeweekse overuren.
 *  - Weekdag normaal  = max(0, 24 − satUren − zonUren)
 *  - Weekdag overuren = weekdagUren − weekdag normaal
 */
export function calculateWeekExtra(
  calculations: DayCalculation[],
  settings: Settings,
): WeekExtraResult {
  const rate = settings.hourlyRate;
  const standardPay = 24 * rate;

  // Gebruik de CAO-correcte splits
  const {
    satHours,
    sunHours,
    weekdayNormalHours,
    weekdayOvertimeHours,
    totalHours,
  } = splitWeekHours(calculations);

  // +30% extra op doordeweekse overuren (niet op weekend)
  const weeklyBonus =
    totalHours > 24
      ? weekdayOvertimeHours * rate * (settings.weeklyOvertimeBonusPct / 100)
      : 0;

  const totalEarned =
    calculations.reduce((s, c) => s + c.totalEarned, 0) + weeklyBonus;
  const extraPay = Math.max(0, totalEarned - standardPay);

  // Pay amounts per categorie
  const satCalcs = calculations.filter((c) => c.dayOfWeek === 6);
  const sunCalcs = calculations.filter((c) => c.dayOfWeek === 0);

  const saturdayPay = satCalcs.reduce((s, c) => s + c.basePay, 0);
  const sundayPay = sunCalcs.reduce((s, c) => s + c.basePay, 0);
  const nightPay = calculations.reduce((s, c) => s + c.eveningNightPay, 0);
  const travelPay = calculations.reduce((s, c) => s + c.travelAllowance, 0);

  // Doordeweeks overuren: 100% basis + 30% bonus = 130%
  const weekdayOvertimePay = weekdayOvertimeHours * rate + weeklyBonus;

  const weekendSupplementPay = calculations.reduce((s, c) => {
    if (c.dayOfWeek === 6)
      return s + c.workedHours * rate * ((settings.saturdayPct - 100) / 100);
    if (c.dayOfWeek === 0)
      return s + c.workedHours * rate * ((settings.sundayPct - 100) / 100);
    return s;
  }, 0);

  return {
    standardPay,
    extraPay,
    totalEarned,
    weekdayNormalHours,
    weekdayOvertimeHours,
    weekdayOvertimePay,
    saturdayHours: satHours,
    saturdayPay,
    sundayHours: sunHours,
    sundayPay,
    nightPay,
    travelPay,
    weeklyBonus,
    totalHours,
    overtimeTriggered: totalHours > 24 && weekdayOvertimeHours > 0,
    // Legacy
    overtimePay: 0,
    toeslagenPay: nightPay,
    weekendSupplementPay,
  };
}

/**
 * Exporteer weekdata als CSV en download via browser.
 */
export function exportWeekCSV(
  weekDates: Date[],
  calculations: DayCalculation[],
  weekNum: number,
  settings: Settings,
): void {
  const DAY_NAMES = [
    "Zondag",
    "Maandag",
    "Dinsdag",
    "Woensdag",
    "Donderdag",
    "Vrijdag",
    "Zaterdag",
  ];

  const formatDate = (d: Date) =>
    d.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const eur = (n: number) => n.toFixed(2).replace(".", ",");
  const hrs = (n: number) => n.toFixed(2).replace(".", ",");

  const headers = [
    "Datum",
    "Dag",
    "Gewerkte uren (na pauze)",
    "Dagloon",
    "Nachttoeslag",
    "Reiskosten",
    "Totaal dag",
  ];

  const rows = weekDates.map((date, i) => {
    const c = calculations[i];
    if (!c.hasData) {
      return [
        formatDate(date),
        DAY_NAMES[date.getDay()],
        "-",
        "-",
        "-",
        "-",
        "-",
      ];
    }
    return [
      formatDate(date),
      DAY_NAMES[date.getDay()],
      hrs(c.workedHours),
      eur(c.basePay),
      eur(c.eveningNightPay),
      eur(c.travelAllowance),
      eur(c.totalEarned),
    ];
  });

  const extra = calculateWeekExtra(calculations, settings);

  const summaryRows = [
    [],
    ["WEEK SAMENVATTING (CAO Beroepsgoederenvervoer 2026)"],
    ["Totaal gewerkte uren", hrs(extra.totalHours)],
    [
      `Doordeweeks normaal (${formatHours(extra.weekdayNormalHours)} à 100%)`,
      eur(extra.weekdayNormalHours * settings.hourlyRate),
    ],
    [
      `Doordeweeks overuren (${formatHours(extra.weekdayOvertimeHours)} à 130%)`,
      eur(extra.weekdayOvertimePay),
    ],
    [
      `Zaterdag (${formatHours(extra.saturdayHours)} à ${settings.saturdayPct}%)`,
      eur(extra.saturdayPay),
    ],
    [
      `Zondag (${formatHours(extra.sundayHours)} à ${settings.sundayPct}%)`,
      eur(extra.sundayPay),
    ],
    ["Weekbonus +30% (alleen doordeweekse overuren)", eur(extra.weeklyBonus)],
    ["Nachttoeslag", eur(extra.nightPay)],
    ["Reiskosten", eur(extra.travelPay)],
    ["", ""],
    ["Standaardloon (24u basis)", eur(extra.standardPay)],
    ["Extra verdiend (uitbetaling volgende periode)", eur(extra.extraPay)],
  ];

  const csvEscape = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const csvLines = [
    `Week ${weekNum} - Loon Overzicht`,
    "",
    headers.map(csvEscape).join(";"),
    ...rows.map((r) => r.map(csvEscape).join(";")),
    [],
    ...summaryRows.map((r) => r.map((v) => csvEscape(String(v))).join(";")),
  ];

  const csv = csvLines.join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `week${weekNum}_loon_overzicht.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Berekent een schatting van het nettoloon na alle werknemersinhouding.
 */
export function calculateNetPay(grossPay: number, settings: Settings): number {
  const deductions =
    grossPay * (settings.pensionPct / 100) +
    grossPay * (settings.wiaHiaatPct / 100) +
    grossPay * (settings.soobPct / 100) +
    grossPay * (settings.whkPct / 100) +
    grossPay * (settings.loonheffingPct / 100);
  return Math.max(0, grossPay - deductions);
}

/**
 * Berekent de huidige 4-weken periode op basis van een anker-datum.
 */
export function getCurrentPeriod(today: Date = new Date()): {
  periodNumber: number;
  startDate: Date;
  endDate: Date;
  nextStartDate: Date;
  nextEndDate: Date;
} {
  const anchor = new Date(2025, 11, 29);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor((today.getTime() - anchor.getTime()) / msPerDay);
  const periodIndex = Math.floor(daysDiff / 28);
  const periodStart = new Date(anchor);
  periodStart.setDate(anchor.getDate() + periodIndex * 28);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 27);
  const nextStart = new Date(periodStart);
  nextStart.setDate(periodStart.getDate() + 28);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextStart.getDate() + 27);

  return {
    periodNumber: periodIndex + 1,
    startDate: periodStart,
    endDate: periodEnd,
    nextStartDate: nextStart,
    nextEndDate: nextEnd,
  };
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}u`;
  return `${h}u ${m}m`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDutchDate(date: Date): string {
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getWeekDates(weekOffset: number): Date[] {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDutchShortDate(date: Date): string {
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
}

export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
