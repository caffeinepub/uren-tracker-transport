import { Toaster } from "@/components/ui/sonner";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ScanLine,
  Settings as SettingsIcon,
  TrendingUp,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { CaoTab } from "./components/CaoTab";
import { DayCard } from "./components/DayCard";
import { JaarprognoseTab } from "./components/JaarprognoseTab";
import { MaandScanModal } from "./components/MaandScanModal";
import { ScanModal } from "./components/ScanModal";
import { SettingsPage } from "./components/SettingsPage";
import { SimulationCard } from "./components/SimulationCard";
import { WeekExtraCard } from "./components/WeekExtraCard";
import { WeekTotals } from "./components/WeekTotals";
import { useWeekData } from "./hooks/useWeekData";
import type { DayEntry } from "./types";
import {
  calculateDay,
  calculateDetailedNetPay,
  calculateWeekExtra,
  formatDateKey,
  formatDutchDate,
  formatDutchShortDate,
  getCurrentPeriod,
  getWeekDates,
  getWeekNumber,
} from "./utils/calculations";

type Tab = "week" | "jaarprognose" | "cao" | "instellingen";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [scanOpen, setScanOpen] = useState(false);
  const [maandScanOpen, setMaandScanOpen] = useState(false);
  const {
    settings,
    updateDay,
    updateSettings,
    getEntry,
    addWeekIncome,
    addWeekExtraPay,
    getCumulativeIncome,
    getAllWeekIncomes,
    getAllWeekExtraIncomes,
  } = useWeekData();

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const calculations = useMemo(
    () =>
      weekDates.map((date) => {
        const key = formatDateKey(date);
        const entry = getEntry(key);
        return calculateDay(entry, date.getDay(), settings);
      }),
    [weekDates, getEntry, settings],
  );

  const weekNum = getWeekNumber(weekDates[0]);
  const currentWeekYear = weekDates[0].getFullYear();

  const weekExtra = useMemo(
    () => calculateWeekExtra(calculations, settings),
    [calculations, settings],
  );

  const grandTotal = useMemo(() => {
    const totalEarned = calculations.reduce((s, c) => s + c.totalEarned, 0);
    return totalEarned + weekExtra.weeklyBonus;
  }, [calculations, weekExtra]);

  const cumulativeIncome = useMemo(
    () => getCumulativeIncome(currentWeekYear, weekNum),
    [getCumulativeIncome, currentWeekYear, weekNum],
  );

  // Cumulative for current year (all weeks) for jaarprognose
  const yearCumulativeIncome = useMemo(
    () => getCumulativeIncome(new Date().getFullYear()),
    [getCumulativeIncome],
  );

  // Net base pay for 4 weeks (used in period summary)
  const netBasePay4Weeks = useMemo(() => {
    const detailed = calculateDetailedNetPay(weekExtra, settings, 0);
    return detailed.netThisWeek * 4;
  }, [weekExtra, settings]);

  const period = useMemo(() => getCurrentPeriod(), []);

  useEffect(() => {
    if (grandTotal > 0) {
      addWeekIncome(weekNum, currentWeekYear, grandTotal);
    }
  }, [weekNum, currentWeekYear, grandTotal, addWeekIncome]);

  // Store extra pay (meerwerk) per week separately
  useEffect(() => {
    if (weekExtra.extraPay > 0) {
      addWeekExtraPay(weekNum, currentWeekYear, weekExtra.extraPay);
    }
  }, [weekNum, currentWeekYear, weekExtra.extraPay, addWeekExtraPay]);

  const handleScanApply = (entries: Record<string, DayEntry>) => {
    for (const [key, entry] of Object.entries(entries)) {
      updateDay(key, entry);
    }
  };

  const weekLabel = `Week ${weekNum} \u2013 ${currentWeekYear}: ${formatDutchShortDate(weekDates[0])} \u2013 ${formatDutchShortDate(weekDates[6])}`;

  const currentYear = new Date().getFullYear();

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "week",
      label: "Weekoverzicht",
      icon: <Calendar className="w-3.5 h-3.5" />,
    },
    {
      id: "jaarprognose",
      label: "Jaarprognose",
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      id: "cao",
      label: "CAO Artikelen",
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      id: "instellingen",
      label: "Instellingen",
      icon: <SettingsIcon className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.048 240), oklch(0.28 0.055 240))",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.72 0.165 55)" }}
            >
              <Truck className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              TruckTijden
            </span>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  activeTab === item.id
                    ? "text-white border-b-2"
                    : "text-white/60 hover:text-white/90"
                }`}
                style={
                  activeTab === item.id
                    ? { borderBottomColor: "oklch(0.72 0.165 55)" }
                    : {}
                }
                data-ocid={`nav.${item.id}.tab`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === "week" ? (
          <>
            {/* 4-weken periode banner */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border px-4 py-3 mb-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[13px]"
              style={{
                background: "oklch(0.96 0.025 240)",
                borderColor: "oklch(0.80 0.06 240)",
                color: "oklch(0.35 0.07 240)",
              }}
            >
              <div className="flex items-center gap-2 shrink-0">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">
                  Periode {period.periodNumber} 2026
                </span>
                <span className="text-[12px] opacity-70">
                  {formatDutchDate(period.startDate)} \u2013{" "}
                  {formatDutchDate(period.endDate)}
                </span>
              </div>
              <div
                className="hidden sm:block w-px h-4 self-center"
                style={{ background: "oklch(0.80 0.06 240)" }}
              />
              <span className="opacity-80">
                Overuren & toeslagen van deze periode worden uitbetaald in{" "}
                <strong>
                  periode {period.periodNumber + 1} (
                  {formatDutchDate(period.nextStartDate)} \u2013{" "}
                  {formatDutchDate(period.nextEndDate)})
                </strong>
              </span>
            </motion.div>

            {/* Week navigation */}
            <div className="flex items-center justify-between mb-6">
              <motion.h1
                key={weekLabel}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl sm:text-2xl font-bold text-foreground"
              >
                {weekLabel}
              </motion.h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
                  data-ocid="week.pagination_prev"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="px-3 h-8 rounded-lg border border-border bg-card text-[12px] font-medium text-foreground hover:bg-muted transition-colors"
                  data-ocid="week.primary_button"
                >
                  Deze week
                </button>
                <button
                  type="button"
                  onClick={() => setScanOpen(true)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-[12px] font-medium transition-colors"
                  style={{
                    borderColor: "oklch(0.72 0.165 55 / 40%)",
                    background: "oklch(0.97 0.03 55)",
                    color: "oklch(0.45 0.12 55)",
                  }}
                  data-ocid="week.scan_button"
                  title="Scan uitdraai van werkgever"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Scan uitdraai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMaandScanOpen(true)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg border text-[12px] font-medium transition-colors"
                  style={{
                    borderColor: "oklch(0.55 0.16 145 / 40%)",
                    background: "oklch(0.97 0.03 145)",
                    color: "oklch(0.40 0.16 145)",
                  }}
                  data-ocid="week.maand_scan_button"
                  title="Maandelijkse urenbijlage inscannen"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Maand inscannen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
                  data-ocid="week.pagination_next"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Day cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {weekDates.map((date, i) => (
                <DayCard
                  key={formatDateKey(date)}
                  date={date}
                  dayIndex={i}
                  entry={getEntry(formatDateKey(date))}
                  calc={calculations[i]}
                  onUpdate={(entry) => updateDay(formatDateKey(date), entry)}
                />
              ))}
            </div>

            {/* Week extra card (simpel overzicht) */}
            <WeekExtraCard
              calculations={calculations}
              settings={settings}
              weekNum={weekNum}
              weekExtraIncomes={getAllWeekExtraIncomes()}
              periodStartDate={period.startDate}
              periodEndDate={period.endDate}
              netBasePay4Weeks={netBasePay4Weeks}
            />

            {/* Week totals (officiele loonstrook-weergave) */}
            <WeekTotals
              calculations={calculations}
              hourlyRate={settings.hourlyRate}
              weeklyOvertimeBonusPct={settings.weeklyOvertimeBonusPct}
              settings={settings}
              weekNum={weekNum}
              weekDates={weekDates}
              cumulativeIncome={cumulativeIncome}
            />

            {/* Simulatie card */}
            <SimulationCard settings={settings} />
          </>
        ) : activeTab === "jaarprognose" ? (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
              Jaarprognose {new Date().getFullYear()}
            </h1>
            <JaarprognoseTab
              settings={settings}
              cumulativeIncome={yearCumulativeIncome}
              getAllWeekIncomes={getAllWeekIncomes}
            />
          </>
        ) : activeTab === "cao" ? (
          <CaoTab />
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
              Instellingen
            </h1>
            <SettingsPage settings={settings} onSave={updateSettings} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[12px] text-muted-foreground border-t border-border">
        \u00a9 {currentYear}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Gemaakt met \u2764\ufe0f via caffeine.ai
        </a>
      </footer>

      <MaandScanModal
        open={maandScanOpen}
        onClose={() => setMaandScanOpen(false)}
        settings={settings}
        onApply={handleScanApply}
      />
      <ScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        weekDates={weekDates}
        onApply={handleScanApply}
      />
      <Toaster />
    </div>
  );
}
