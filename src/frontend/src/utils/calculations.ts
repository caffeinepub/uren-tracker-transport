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
    dayOfWeekSupplement: 0,
    travelAllowance: 0,
    totalEarned: 0,
    toeslagPercentage: 0,
    hasData: false,
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
  const baseHours = Math.min(workedHours, 8);
  const overtimeHours = Math.max(0, workedHours - 8);

  const rate = settings.hourlyRate;

  // Base pay (first 8 hours)
  const basePay = baseHours * rate;

  // Overtime pay based on day of week
  // Saturday overtime: 50% toeslag = 150% of rate
  // Sunday overtime:  200% toeslag = 300% of rate
  // Weekday overtime: first 2h at 125%, rest at 150%
  let overtimePay = 0;
  if (overtimeHours > 0) {
    if (dayOfWeek === 6) {
      // Saturday: 150%
      overtimePay = overtimeHours * rate * 1.5;
    } else if (dayOfWeek === 0) {
      // Sunday: 300%
      overtimePay = overtimeHours * rate * 3.0;
    } else {
      // Weekday: first 2 OT at 125%, rest at 150%
      const first2OT = Math.min(overtimeHours, 2);
      const remaining = Math.max(0, overtimeHours - 2);
      overtimePay = first2OT * rate * 1.25 + remaining * rate * 1.5;
    }
  }

  // Evening (18:00-22:00) and Night (22:00-06:00) supplements
  const eveningStart = 18 * 60;
  const eveningEnd = 22 * 60;

  let eveningMinutes = 0;
  let nightMinutes = 0;

  const breakFactor =
    entry.breakMinutes > 0
      ? workedMinutes / (workedMinutes + entry.breakMinutes)
      : 1;

  for (let m = startMinutes; m < endMinutes; m++) {
    const adjustedTime = m % (24 * 60);
    const isEvening = adjustedTime >= eveningStart && adjustedTime < eveningEnd;
    const isNight = adjustedTime >= 22 * 60 || adjustedTime < 6 * 60;
    if (isEvening) eveningMinutes++;
    if (isNight) nightMinutes++;
  }

  eveningMinutes = Math.round(eveningMinutes * breakFactor);
  nightMinutes = Math.round(nightMinutes * breakFactor);

  const eveningHours = eveningMinutes / 60;
  const nightHours = nightMinutes / 60;

  // Evening supplement = +30%, Night supplement = +50%
  const eveningNightPay = eveningHours * rate * 0.3 + nightHours * rate * 0.5;

  // Day-of-week supplement on BASE hours
  // Saturday: +50% on all worked hours (not just overtime)
  // Sunday: +200% on all worked hours
  // NOTE: The extra weekend toeslag on overtime is already captured in overtimePay above.
  // Here we track the supplement on base hours only.
  let dayMultiplierExtra = 0;
  if (dayOfWeek === 6) {
    dayMultiplierExtra = 0.5; // 50% toeslag
  } else if (dayOfWeek === 0) {
    dayMultiplierExtra = 2.0; // 200% toeslag
  }
  const dayOfWeekSupplement = baseHours * rate * dayMultiplierExtra;

  const travelAllowance = settings.travelAllowancePerDay;
  const totalEarned =
    basePay +
    overtimePay +
    eveningNightPay +
    dayOfWeekSupplement +
    travelAllowance;

  // Toeslag percentage display
  const toeslagPercentage =
    dayOfWeek === 6 ? 50 : dayOfWeek === 0 ? 200 : overtimeHours > 0 ? 25 : 0;

  return {
    workedMinutes,
    workedHours,
    baseHours,
    overtimeHours,
    basePay,
    overtimePay,
    eveningNightPay,
    dayOfWeekSupplement,
    travelAllowance,
    totalEarned,
    toeslagPercentage,
    hasData: true,
  };
}

/**
 * Calculates the 30% extra bonus that applies when total weekly hours exceed 24.
 * The 30% extra is applied to overtime hours once the 24h threshold is crossed.
 */
export function calculateWeeklyOvertimeBonus(
  calculations: DayCalculation[],
  hourlyRate: number,
): number {
  const totalHours = calculations.reduce((s, c) => s + c.workedHours, 0);
  if (totalHours <= 24) return 0;

  const totalOvertimeHours = calculations.reduce(
    (s, c) => s + c.overtimeHours,
    0,
  );
  // 30% extra on overtime hours
  return totalOvertimeHours * hourlyRate * 0.3;
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
