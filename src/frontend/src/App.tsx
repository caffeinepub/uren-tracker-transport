import { Toaster } from "@/components/ui/sonner";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Settings as SettingsIcon,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { DayCard } from "./components/DayCard";
import { SettingsPage } from "./components/SettingsPage";
import { SimulationCard } from "./components/SimulationCard";
import { WeekExtraCard } from "./components/WeekExtraCard";
import { WeekTotals } from "./components/WeekTotals";
import { useWeekData } from "./hooks/useWeekData";
import {
  calculateDay,
  calculateWeekExtra,
  formatDateKey,
  formatDutchDate,
  formatDutchShortDate,
  getCurrentPeriod,
  getWeekDates,
  getWeekNumber,
} from "./utils/calculations";

type Tab = "week" | "instellingen";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const {
    settings,
    updateDay,
    updateSettings,
    getEntry,
    addWeekIncome,
    getCumulativeIncome,
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

  useEffect(() => {
    if (grandTotal > 0) {
      addWeekIncome(weekNum, currentWeekYear, grandTotal);
    }
  }, [weekNum, currentWeekYear, grandTotal, addWeekIncome]);

  const weekLabel = `Week ${weekNum}: ${formatDutchShortDate(weekDates[0])} – ${formatDutchShortDate(weekDates[6])}`;

  const currentYear = new Date().getFullYear();
  const period = useMemo(() => getCurrentPeriod(), []);

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
            <button
              type="button"
              onClick={() => setActiveTab("week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === "week"
                  ? "text-white border-b-2"
                  : "text-white/60 hover:text-white/90"
              }`}
              style={
                activeTab === "week"
                  ? { borderBottomColor: "oklch(0.72 0.165 55)" }
                  : {}
              }
              data-ocid="nav.week.tab"
            >
              <Calendar className="w-3.5 h-3.5" />
              Weekoverzicht
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("instellingen")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === "instellingen"
                  ? "text-white border-b-2"
                  : "text-white/60 hover:text-white/90"
              }`}
              style={
                activeTab === "instellingen"
                  ? { borderBottomColor: "oklch(0.72 0.165 55)" }
                  : {}
              }
              data-ocid="nav.settings.tab"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              Instellingen
            </button>
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
                  {formatDutchDate(period.startDate)} –{" "}
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
                  {formatDutchDate(period.nextStartDate)} –{" "}
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
            />

            {/* Week totals (officiële loonstrook-weergave) */}
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
        © {currentYear}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Gemaakt met ❤️ via caffeine.ai
        </a>
      </footer>

      <Toaster />
    </div>
  );
}
