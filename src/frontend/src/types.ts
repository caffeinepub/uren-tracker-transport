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
  keuzebudgetEnabled: boolean; // Keuzebudget opbouw meenemen in berekening
  // Heffingskortingen (jaarlijks bedrag, wordt wekelijks verrekend)
  algHeffingskorting: number; // Algemene heffingskorting 2026
  arbeidskorting: number; // Arbeidskorting 2026
  // Pensioenprognose (Pensioenfonds Vervoer)
  pensionFranchise: number; // €17.283 default (2026)
  pensionBuildupPct: number; // 1.788% default (Pensioenfonds Vervoer 2026)
  // Arbeidscontract
  fullTimeHoursPerWeek: number; // Fulltime basis uren per week (standaard 40)
  parttimePct: number; // Parttime percentage (standaard 60)
  contractHoursPerWeek: number; // Berekend: fullTimeHoursPerWeek × parttimePct / 100 (standaard 24)
  pensiongevingSalaryOverride: number | null; // null = auto from app data
  // Fiscale uitruil (cafetariaregeling reiskosten)
  fiscaleUitruil: boolean; // default false
  reisafstandKm: number; // enkelvoudige reisafstand in km, default 0
  reisdagenPerJaar: number; // default 214 (fulltime norm Belastingdienst)
}

export interface WeekData {
  [dateKey: string]: DayEntry; // dateKey = "YYYY-MM-DD"
}
