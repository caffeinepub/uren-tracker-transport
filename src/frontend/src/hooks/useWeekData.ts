import { useCallback, useEffect, useState } from "react";
import type { DayEntry, Settings, WeekData } from "../types";

const STORAGE_KEY = "trucktijden_week_data";
const SETTINGS_KEY = "trucktijden_settings";
const YEAR_INCOME_KEY = "trucktijden_year_income";
const WEEK_EXTRA_KEY = "trucktijden_week_extra";

export const DEFAULT_SETTINGS: Settings = {
  hourlyRate: 20.24,
  travelAllowancePerDay: 10.12,
  saturdayPct: 150,
  sundayPct: 200,
  overtimeWeekday1Pct: 125,
  overtimeWeekday2Pct: 150,
  eveningSupplementPct: 0,
  nightSupplementPct: 19, // CAO 2026 minimum nachttoeslag
  nightStartHour: 21, // 21:00 – start nachttoeslag
  nightEndHour: 5, // 05:00 – einde nachttoeslag
  weeklyOvertimeBonusPct: 30,
  vacationPayPct: 11.84,
  pensionPct: 10.16,
  wiaHiaatPct: 0.9,
  soobPct: 0.245,
  whkPct: 0.52,
  loonheffingPct: 40.2,
  keuzebudgetPct: 100,
  keuzebudgetEnabled: false,
  algHeffingskorting: 3068, // 2026 max voor laag inkomen (< ~€24k)
  arbeidskorting: 5599, // 2026 max (bereikt rond €24k, daalt daarna)
  // Pensioenprognose
  pensionFranchise: 17283,
  pensionBuildupPct: 1.788,
  pensiongevingSalaryOverride: null,
  // Arbeidscontract
  fullTimeHoursPerWeek: 40,
  parttimePct: 60,
  contractHoursPerWeek: 24, // 40 × 60% = 24
  // Fiscale uitruil (cafetariaregeling reiskosten)
  fiscaleUitruil: false,
  reisafstandKm: 0,
  reisdagenPerJaar: 214,
};

function loadWeekData(): WeekData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

type YearIncome = { [weekKey: string]: number };

function loadYearIncome(): YearIncome {
  try {
    const raw = localStorage.getItem(YEAR_INCOME_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadWeekExtra(): YearIncome {
  try {
    const raw = localStorage.getItem(WEEK_EXTRA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useWeekData() {
  const [weekData, setWeekData] = useState<WeekData>(loadWeekData);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [yearIncome, setYearIncome] = useState<YearIncome>(loadYearIncome);
  const [weekExtraMap, setWeekExtraMap] = useState<YearIncome>(loadWeekExtra);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weekData));
  }, [weekData]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(YEAR_INCOME_KEY, JSON.stringify(yearIncome));
  }, [yearIncome]);

  useEffect(() => {
    localStorage.setItem(WEEK_EXTRA_KEY, JSON.stringify(weekExtraMap));
  }, [weekExtraMap]);

  const updateDay = useCallback((dateKey: string, entry: DayEntry) => {
    setWeekData((prev) => ({ ...prev, [dateKey]: entry }));
  }, []);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
  }, []);

  const getEntry = useCallback(
    (dateKey: string): DayEntry => {
      return (
        weekData[dateKey] ?? { startTime: "", endTime: "", breakMinutes: 0 }
      );
    },
    [weekData],
  );

  const addWeekIncome = useCallback(
    (weekNum: number, year: number, grossAmount: number) => {
      const key = `${year}-W${String(weekNum).padStart(2, "0")}`;
      setYearIncome((prev) => ({ ...prev, [key]: grossAmount }));
    },
    [],
  );

  const addWeekExtraPay = useCallback(
    (weekNum: number, year: number, extraPay: number) => {
      const key = `${year}-W${String(weekNum).padStart(2, "0")}`;
      setWeekExtraMap((prev) => ({ ...prev, [key]: extraPay }));
    },
    [],
  );

  const getCumulativeIncome = useCallback(
    (year: number, upToWeekNum?: number): number => {
      return Object.entries(yearIncome).reduce((sum, [key, amount]) => {
        const [keyYear, keyWeek] = key.split("-W");
        if (Number(keyYear) !== year) return sum;
        if (upToWeekNum !== undefined && Number(keyWeek) > upToWeekNum)
          return sum;
        return sum + amount;
      }, 0);
    },
    [yearIncome],
  );

  const getAllWeekIncomes = useCallback(() => yearIncome, [yearIncome]);

  const getAllWeekExtraIncomes = useCallback(
    () => weekExtraMap,
    [weekExtraMap],
  );

  return {
    weekData,
    settings,
    updateDay,
    updateSettings,
    getEntry,
    addWeekIncome,
    addWeekExtraPay,
    getCumulativeIncome,
    getAllWeekIncomes,
    getAllWeekExtraIncomes,
  };
}
