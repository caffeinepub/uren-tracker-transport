export interface DayEntry {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  breakMinutes: number;
}

export interface DayCalculation {
  workedMinutes: number;
  workedHours: number;
  baseHours: number;
  overtimeHours: number;
  basePay: number;
  overtimePay: number;
  eveningNightPay: number;
  nightHours: number; // uren vallend in nacht-toeslag venster
  dayOfWeekSupplement: number;
  travelAllowance: number;
  totalEarned: number;
  toeslagPercentage: number;
  hasData: boolean;
  vacationPayAccrual: number;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export interface Settings {
  hourlyRate: number;
  travelAllowancePerDay: number;
  // Dag-toeslagen (totaal uitbetaald percentage, bv. 150 = 1,5x uurloon)
  saturdayPct: number; // standaard 150
  sundayPct: number; // standaard 200
  // Doordeweekse overuren
  overtimeWeekday1Pct: number; // eerste 2 uur, standaard 125
  overtimeWeekday2Pct: number; // daarna, standaard 150
  // Avondtoeslag (extra % bovenop basistarief)
  eveningSupplementPct: number; // 18:00-21:00, standaard 0 (niet verplicht CAO)
  // Nachttoeslag CAO – configureerbaar venster en percentage
  nightSupplementPct: number; // extra % boven basistarief (standaard 19 = CAO minimum)
  nightStartHour: number; // standaard 21 (21:00)
  nightEndHour: number; // standaard 5 (05:00)
  // Weekbonus
  weeklyOvertimeBonusPct: number; // boven 24u/week, standaard 30
  // CAO inhoudingen (werknemersaandeel)
  vacationPayPct: number; // Vakantiegeld 11.84%
  pensionPct: number; // Pensioen Pensioenfonds Vervoer 10.16%
  wiaHiaatPct: number; // WIA-Hiaat verzekering 0.90%
  soobPct: number; // SOOB opleidingsfonds 0.245%
  whkPct: number; // Gediff. premie Whk 0.52%
  loonheffingPct: number; // Loonheffing bijzonder tarief 40.20%
  keuzebudgetPct: number; // Keuzebudget opbouw 100%
  // Heffingskortingen (jaarlijks bedrag, wordt wekelijks verrekend)
  algHeffingskorting: number; // Algemene heffingskorting 2026
  arbeidskorting: number; // Arbeidskorting 2026
}

export interface WeekData {
  [dateKey: string]: DayEntry; // dateKey = "YYYY-MM-DD"
}
