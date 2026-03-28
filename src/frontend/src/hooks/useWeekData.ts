import { useCallback, useEffect, useState } from "react";
import type { DayEntry, Settings, WeekData } from "../types";

const STORAGE_KEY = "trucktijden_week_data";
const SETTINGS_KEY = "trucktijden_settings";

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
  algHeffingskorting: 3068, // 2026 max voor laag inkomen (< ~€24k)
  arbeidskorting: 5599, // 2026 max (bereikt rond €24k, daalt daarna)
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

export function useWeekData() {
  const [weekData, setWeekData] = useState<WeekData>(loadWeekData);
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weekData));
  }, [weekData]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

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

  return { weekData, settings, updateDay, updateSettings, getEntry };
}
