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
  dayOfWeekSupplement: number;
  travelAllowance: number;
  totalEarned: number;
  toeslagPercentage: number;
  hasData: boolean;
}

export interface Settings {
  hourlyRate: number;
  travelAllowancePerDay: number;
}

export interface WeekData {
  [dateKey: string]: DayEntry; // dateKey = "YYYY-MM-DD"
}
