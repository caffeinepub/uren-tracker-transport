import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  BadgeCheck,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Euro,
  Moon,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { DayCalculation, Settings } from "../types";
import {
  calculateDetailedNetPay,
  calculateNetPay,
  calculateWeekExtra,
  exportWeekCSV,
  formatCurrency,
  formatHours,
} from "../utils/calculations";

interface WeekTotalsProps {
  calculations: DayCalculation[];
  hourlyRate: number;
  weeklyOvertimeBonusPct?: number;
  settings: Settings;
  weekNum: number;
  weekDates: Date[];
  cumulativeIncome?: number;
}

// ─── Reusable row component for the detailed net pay card ─────────────────────
function PayRow({
  label,
  amount,
  note,
  color = "default",
  bold = false,
  large = false,
}: {
  label: string;
  amount: number;
  note?: string;
  color?: "default" | "green" | "red" | "orange" | "muted";
  bold?: boolean;
  large?: boolean;
}) {
  const colorMap = {
    default: "var(--foreground)",
    green: "oklch(0.40 0.18 145)",
    red: "oklch(0.48 0.20 25)",
    orange: "oklch(0.52 0.18 55)",
    muted: "var(--muted-foreground)",
  };

  return (
    <div className="flex items-baseline justify-between gap-2 py-1">
      <div className="flex-1 min-w-0">
        <span
          className={`text-[12px] ${bold ? "font-semibold" : "font-normal"}`}
          style={{
            color: color === "default" ? "var(--foreground)" : colorMap[color],
          }}
        >
          {label}
        </span>
        {note && (
          <span
            className="ml-1.5 text-[11px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            {note}
          </span>
        )}
      </div>
      <span
        className={`tabular-nums shrink-0 ${large ? "text-base" : "text-[13px]"} ${bold ? "font-bold" : "font-medium"}`}
        style={{ color: colorMap[color] }}
      >
        {amount < 0
          ? `-${formatCurrency(Math.abs(amount))}`
          : formatCurrency(amount)}
      </span>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-3 mb-1">
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      <span
        className="text-[10px] font-bold uppercase tracking-widest px-1"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}

export function WeekTotals({
  calculations,
  hourlyRate: _hourlyRate,
  weeklyOvertimeBonusPct = 30,
  settings,
  weekNum,
  weekDates,
  cumulativeIncome = 0,
}: WeekTotalsProps) {
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [showPayslipComparison, setShowPayslipComparison] = useState(false);
  const [payslipThisPeriod, setPayslipThisPeriod] = useState("");
  const [payslipNextPeriod, setPayslipNextPeriod] = useState("");

  const totals = calculations.reduce(
    (acc, c) => ({
      workedHours: acc.workedHours + c.workedHours,
      baseHours: acc.baseHours + c.baseHours,
      nightHours: acc.nightHours + c.nightHours,
      travelTotal: acc.travelTotal + c.travelAllowance,
      totalEarned: acc.totalEarned + c.totalEarned,
      vacationPayAccrual: acc.vacationPayAccrual + c.vacationPayAccrual,
    }),
    {
      workedHours: 0,
      baseHours: 0,
      nightHours: 0,
      travelTotal: 0,
      totalEarned: 0,
      vacationPayAccrual: 0,
    },
  );

  const toeslagen = calculations.reduce(
    (acc, c) => acc + c.eveningNightPay + c.dayOfWeekSupplement,
    0,
  );

  const weekExtra = calculateWeekExtra(calculations, settings);
  const {
    weekdayOvertimeHours,
    weekdayNormalHours,
    saturdayHours,
    sundayHours,
    weeklyBonus,
  } = weekExtra;

  const above24 = weekdayOvertimeHours > 0;
  const grandTotal = totals.totalEarned + weeklyBonus;
  const netPay = calculateNetPay(grandTotal, settings);
  const hasDelayedItems = weekdayOvertimeHours > 0 || totals.nightHours > 0;

  const algHeffingskorting = settings.algHeffingskorting ?? 3068;
  const arbeidskorting = settings.arbeidskorting ?? 5599;
  const weeklyHeffingskorting = (algHeffingskorting + arbeidskorting) / 52;

  // Detailed net pay calculation
  const detailed = calculateDetailedNetPay(
    weekExtra,
    settings,
    totals.vacationPayAccrual,
  );

  const items = [
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Doordeweeks",
      value: formatHours(weekdayNormalHours + weekdayOvertimeHours),
      sub: above24
        ? `24u normaal + ${formatHours(weekdayOvertimeHours)} overuren`
        : `${formatHours(weekdayNormalHours)} à 100%`,
      highlight: above24,
      green: false,
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Doordeweeks overuren",
      value: formatHours(weekdayOvertimeHours),
      sub:
        weekdayOvertimeHours > 0
          ? `${formatHours(weekdayOvertimeHours)} à 130%`
          : "geen",
      highlight: weekdayOvertimeHours > 0,
      delayed: weekdayOvertimeHours > 0,
      green: false,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Zaterdag",
      value: formatHours(saturdayHours),
      sub: saturdayHours > 0 ? "altijd 150%" : "geen",
      highlight: saturdayHours > 0,
      green: false,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Zondag",
      value: formatHours(sundayHours),
      sub: sundayHours > 0 ? "altijd 200%" : "geen",
      highlight: sundayHours > 0,
      green: false,
    },
    {
      icon: <Moon className="w-4 h-4" />,
      label: "Nachturen",
      value: formatHours(totals.nightHours),
      sub:
        totals.nightHours > 0
          ? `+${settings.nightSupplementPct}% toeslag`
          : "geen",
      highlight: totals.nightHours > 0,
      delayed: totals.nightHours > 0,
      green: false,
    },
    {
      icon: <Euro className="w-4 h-4" />,
      label: "Bruto loon",
      value: formatCurrency(grandTotal),
      sub:
        weeklyBonus > 0
          ? `incl. +${weeklyOvertimeBonusPct}% bonus`
          : "incl. alles",
      highlight: true,
      large: true,
      green: false,
    },
    {
      icon: <Percent className="w-4 h-4" />,
      label: "Toeslagen",
      value: formatCurrency(toeslagen + weeklyBonus),
      sub:
        [
          saturdayHours > 0 ? "za 150%" : "",
          sundayHours > 0 ? "zo 200%" : "",
          weeklyBonus > 0 ? `+${weeklyOvertimeBonusPct}% bonus` : "",
        ]
          .filter(Boolean)
          .join(" · ") || "avond/nacht",
      green: false,
    },
    {
      icon: <Car className="w-4 h-4" />,
      label: "Reiskosten",
      value: formatCurrency(totals.travelTotal),
      sub: "vergoeding",
      green: false,
    },
    {
      icon: <Percent className="w-4 h-4" />,
      label: "Vakantiegeld",
      value: formatCurrency(totals.vacationPayAccrual),
      sub: `${settings.vacationPayPct}% opbouw`,
      green: false,
    },
    {
      icon: <BadgeCheck className="w-4 h-4" />,
      label: "Heffingskorting",
      value: formatCurrency(weeklyHeffingskorting),
      sub: "alg. + arbeidskorting (week)",
      highlight: false,
      green: true,
    },
    {
      icon: <Wallet className="w-4 h-4" />,
      label: "Netto schatting",
      value: formatCurrency(netPay),
      sub: "na inhoudingen + korting",
      highlight: true,
      large: true,
      green: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.32 }}
      className="space-y-3"
    >
      {/* Vertraagde uitbetaling waarschuwing */}
      {hasDelayedItems && (
        <div
          className="rounded-xl border px-4 py-3 flex items-start gap-3 text-[13px]"
          style={{
            background: "oklch(0.97 0.025 55)",
            borderColor: "oklch(0.85 0.08 55)",
            color: "oklch(0.45 0.12 55)",
          }}
        >
          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Vertraagde uitbetaling —</span>{" "}
            Doordeweekse overuren
            {totals.nightHours > 0 ? " en nachttoeslag" : ""} worden uitbetaald
            in de{" "}
            <span className="font-semibold">volgende 4-weken periode</span>.
          </div>
        </div>
      )}

      <Card
        className="border-border shadow-card rounded-xl overflow-hidden"
        data-ocid="week.totals.card"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Award className="w-4 h-4 text-orange" />
          <h3 className="font-semibold text-foreground text-[15px]">
            Weekoverzicht totalen
          </h3>
          {above24 && (
            <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange/10 text-orange">
              +{weeklyOvertimeBonusPct}% weekbonus actief (doordeweeks boven
              24u)
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-7 px-2.5 text-[12px] gap-1.5"
            onClick={() =>
              exportWeekCSV(weekDates, calculations, weekNum, settings)
            }
            data-ocid="week.export.button"
          >
            <Download className="w-3.5 h-3.5" />
            CSV exporteren
          </Button>
        </div>
        <div className="p-5">
          {/* Prominent 24u drempel + weekbonus blok */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div
              className="rounded-xl p-4 border"
              style={{
                background: "oklch(0.97 0.02 220)",
                borderColor: "oklch(0.86 0.06 220)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wide mb-1"
                style={{ color: "oklch(0.48 0.09 220)" }}
              >
                Doordeweeks (ma–vr) normaal
              </p>
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color: "oklch(0.28 0.10 220)" }}
              >
                {formatHours(weekExtra.weekdayNormalHours)}
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "oklch(0.52 0.07 220)" }}
              >
                {formatCurrency(
                  weekExtra.weekdayNormalHours * settings.hourlyRate,
                )}{" "}
                à 100% (max 24u)
              </p>
            </div>
            <div
              className="rounded-xl p-4 border"
              style={{
                background:
                  weekExtra.weekdayOvertimeHours > 0
                    ? "oklch(0.96 0.06 55)"
                    : "oklch(0.97 0.01 55)",
                borderColor:
                  weekExtra.weekdayOvertimeHours > 0
                    ? "oklch(0.82 0.14 55)"
                    : "oklch(0.90 0.04 55)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wide mb-1"
                style={{
                  color:
                    weekExtra.weekdayOvertimeHours > 0
                      ? "oklch(0.44 0.16 55)"
                      : "oklch(0.55 0.07 55)",
                }}
              >
                Doordeweeks overuren (+{weeklyOvertimeBonusPct}%)
              </p>
              <p
                className="text-xl font-bold tabular-nums"
                style={{
                  color:
                    weekExtra.weekdayOvertimeHours > 0
                      ? "oklch(0.38 0.20 55)"
                      : "oklch(0.60 0.08 55)",
                }}
              >
                {weekExtra.weekdayOvertimeHours > 0
                  ? formatHours(weekExtra.weekdayOvertimeHours)
                  : "—"}
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{
                  color:
                    weekExtra.weekdayOvertimeHours > 0
                      ? "oklch(0.44 0.14 55)"
                      : "oklch(0.62 0.06 55)",
                }}
              >
                {weekExtra.weekdayOvertimeHours > 0
                  ? `${formatCurrency(weekExtra.weeklyBonus)} bonus à 130%`
                  : "doordeweeks nog niet boven 24u"}
              </p>
            </div>
          </div>

          {/* Heffingskorting banner */}
          <div
            className="rounded-xl p-4 border mb-5 flex items-center gap-4"
            style={{
              background: "oklch(0.96 0.06 145)",
              borderColor: "oklch(0.82 0.12 145)",
            }}
          >
            <BadgeCheck
              className="w-5 h-5 shrink-0"
              style={{ color: "oklch(0.42 0.16 145)" }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-bold uppercase tracking-wide"
                style={{ color: "oklch(0.42 0.14 145)" }}
              >
                Heffingskorting 2026
              </p>
              <p
                className="text-[13px] font-semibold mt-0.5"
                style={{ color: "oklch(0.30 0.14 145)" }}
              >
                Algemene heffingskorting (€
                {algHeffingskorting.toLocaleString("nl-NL")}/jr) +
                Arbeidskorting (€{arbeidskorting.toLocaleString("nl-NL")}/jr)
              </p>
              <p
                className="text-[12px] mt-0.5"
                style={{ color: "oklch(0.46 0.12 145)" }}
              >
                Wekelijks voordeel:{" "}
                <strong>{formatCurrency(weeklyHeffingskorting)}</strong> —
                verlaagt je loonheffing, verhoogt je nettoloon
              </p>
            </div>
            <div className="text-right shrink-0">
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color: "oklch(0.36 0.18 145)" }}
              >
                +{formatCurrency(weeklyHeffingskorting)}
              </p>
              <p
                className="text-[11px]"
                style={{ color: "oklch(0.50 0.12 145)" }}
              >
                per week
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-10 gap-4">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {item.green ? (
                    <span style={{ color: "oklch(0.50 0.16 145)" }}>
                      {item.icon}
                    </span>
                  ) : (
                    item.icon
                  )}
                  <span className="text-[11px] font-medium uppercase tracking-wide">
                    {item.label}
                  </span>
                  {"delayed" in item && item.delayed && (
                    <span
                      title="Uitbetaald in volgende periode"
                      className="text-[10px] font-bold ml-auto"
                      style={{ color: "oklch(0.6 0.12 55)" }}
                    >
                      ▶ later
                    </span>
                  )}
                </div>
                <p
                  className={`font-bold tabular-nums ${
                    item.large ? "text-xl" : "text-base"
                  }`}
                  style={{
                    color: item.green
                      ? "oklch(0.40 0.18 145)"
                      : item.highlight
                        ? "var(--orange)"
                        : "var(--foreground)",
                  }}
                >
                  {item.value}
                </p>
                <p className="text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ─── Realistische Netto Schatting Card ─────────────────────────────── */}
      <Card
        className="border-border shadow-card rounded-xl overflow-hidden"
        data-ocid="week.netto.card"
      >
        {/* Header */}
        <button
          type="button"
          className="w-full px-5 py-4 border-b border-border flex items-center gap-2 hover:bg-muted/30 transition-colors"
          onClick={() => setShowDetailedBreakdown((v) => !v)}
          data-ocid="week.netto.toggle"
        >
          <Wallet
            className="w-4 h-4"
            style={{ color: "oklch(0.45 0.16 145)" }}
          />
          <h3 className="font-semibold text-foreground text-[15px]">
            Netto schatting (realistisch)
          </h3>
          <div className="ml-auto flex items-center gap-3">
            <span
              className="text-xl font-bold tabular-nums"
              style={{ color: "oklch(0.38 0.20 145)" }}
            >
              {formatCurrency(detailed.netTotal)}
            </span>
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "oklch(0.94 0.06 145)",
                color: "oklch(0.40 0.16 145)",
              }}
            >
              totaal netto
            </span>
            {showDetailedBreakdown ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Always-visible summary row */}
        <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className="rounded-lg p-3 border"
            style={{
              background: "oklch(0.97 0.02 220)",
              borderColor: "oklch(0.88 0.05 220)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wide mb-1"
              style={{ color: "oklch(0.50 0.09 220)" }}
            >
              Netto deze periode
            </p>
            <p
              className="text-base font-bold tabular-nums"
              style={{ color: "oklch(0.30 0.12 220)" }}
            >
              {formatCurrency(detailed.netThisWeek)}
            </p>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "oklch(0.55 0.08 220)" }}
            >
              basis {formatHours(24)} à 100%
            </p>
          </div>
          <div
            className="rounded-lg p-3 border"
            style={{
              background:
                detailed.grossDelayed > 0
                  ? "oklch(0.97 0.025 55)"
                  : "oklch(0.97 0.01 55)",
              borderColor:
                detailed.grossDelayed > 0
                  ? "oklch(0.88 0.08 55)"
                  : "oklch(0.92 0.03 55)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wide mb-1"
              style={{
                color:
                  detailed.grossDelayed > 0
                    ? "oklch(0.50 0.14 55)"
                    : "oklch(0.58 0.07 55)",
              }}
            >
              Netto volgende periode
            </p>
            <p
              className="text-base font-bold tabular-nums"
              style={{
                color:
                  detailed.grossDelayed > 0
                    ? "oklch(0.42 0.18 55)"
                    : "oklch(0.62 0.08 55)",
              }}
            >
              {detailed.grossDelayed > 0
                ? `${formatCurrency(detailed.netDelayedLow)} – ${formatCurrency(detailed.netDelayedHigh)}`
                : "—"}
            </p>
            <p
              className="text-[10px] mt-0.5"
              style={{
                color:
                  detailed.grossDelayed > 0
                    ? "oklch(0.52 0.12 55)"
                    : "oklch(0.65 0.06 55)",
              }}
            >
              {detailed.grossDelayed > 0
                ? "na 40,20% bijzonder tarief (range)"
                : "geen overuren/toeslagen"}
            </p>
          </div>
          <div
            className="rounded-lg p-3 border"
            style={{
              background: "oklch(0.97 0.025 145)",
              borderColor: "oklch(0.88 0.06 145)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wide mb-1"
              style={{ color: "oklch(0.48 0.12 145)" }}
            >
              Reiskosten
            </p>
            <p
              className="text-base font-bold tabular-nums"
              style={{ color: "oklch(0.36 0.16 145)" }}
            >
              {formatCurrency(detailed.travelAllowance)}
            </p>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "oklch(0.52 0.10 145)" }}
            >
              belastingvrij
            </p>
          </div>
          <div
            className="rounded-lg p-3 border"
            style={{
              background: "oklch(0.97 0.01 280)",
              borderColor: "oklch(0.90 0.04 280)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wide mb-1"
              style={{ color: "oklch(0.52 0.08 280)" }}
            >
              Vakantiegeld opbouw
            </p>
            <p
              className="text-base font-bold tabular-nums"
              style={{ color: "oklch(0.40 0.10 280)" }}
            >
              {formatCurrency(detailed.vacationAccrual)}
            </p>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "oklch(0.58 0.07 280)" }}
            >
              {settings.vacationPayPct}% — later uitbetaald
            </p>
          </div>
        </div>

        {/* Cumulatief jaarsalaris banner */}
        {cumulativeIncome > 0 && (
          <div className="px-5 pb-3">
            <div
              className="rounded-xl border p-4"
              style={{
                background:
                  cumulativeIncome > 38883
                    ? "oklch(0.96 0.04 25)"
                    : cumulativeIncome > 29700
                      ? "oklch(0.97 0.04 55)"
                      : "oklch(0.97 0.02 280)",
                borderColor:
                  cumulativeIncome > 38883
                    ? "oklch(0.82 0.12 25)"
                    : cumulativeIncome > 29700
                      ? "oklch(0.86 0.10 55)"
                      : "oklch(0.88 0.05 280)",
              }}
              data-ocid="week.cumulative.card"
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-[11px] font-bold uppercase tracking-wide"
                  style={{
                    color:
                      cumulativeIncome > 38883
                        ? "oklch(0.44 0.16 25)"
                        : cumulativeIncome > 29700
                          ? "oklch(0.48 0.14 55)"
                          : "oklch(0.44 0.10 280)",
                  }}
                >
                  Dit jaar al verdiend (bruto)
                </p>
                <p
                  className="text-base font-bold tabular-nums"
                  style={{
                    color:
                      cumulativeIncome > 38883
                        ? "oklch(0.38 0.18 25)"
                        : cumulativeIncome > 29700
                          ? "oklch(0.42 0.18 55)"
                          : "oklch(0.36 0.12 280)",
                  }}
                >
                  {formatCurrency(cumulativeIncome)}
                </p>
              </div>
              <Progress
                value={Math.min(100, (cumulativeIncome / 38883) * 100)}
                className="h-2 mb-2"
              />
              <div
                className="flex justify-between text-[10px]"
                style={{ color: "oklch(0.58 0.06 280)" }}
              >
                <span>€0</span>
                <span>Schijf 1 grens: €38.883</span>
              </div>
              {cumulativeIncome > 38883 && (
                <div
                  className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ color: "oklch(0.44 0.18 25)" }}
                  data-ocid="week.cumulative.error_state"
                >
                  ⚠️ Schijf 2 bereikt (49,50%) — inkomen boven €38.883
                </div>
              )}
              {cumulativeIncome > 29700 && cumulativeIncome <= 38883 && (
                <div
                  className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ color: "oklch(0.50 0.16 55)" }}
                  data-ocid="week.cumulative.success_state"
                >
                  ⚠️ Heffingskorting begint af te bouwen boven €29.700
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expanded detailed breakdown */}
        <AnimatePresence>
          {showDetailedBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                <div
                  className="rounded-xl border p-4"
                  style={{
                    background: "oklch(0.99 0.005 220)",
                    borderColor: "var(--border)",
                  }}
                >
                  {/* ── Directe uitbetaling ─────────────────────── */}
                  <SectionDivider label="Directe uitbetaling (deze periode)" />
                  <PayRow
                    label="Bruto basis (24u contract)"
                    amount={detailed.grossBase}
                    note={`${formatHours(24)} × €${settings.hourlyRate.toFixed(2)}`}
                  />
                  <PayRow
                    label="Reiskosten (belastingvrij)"
                    amount={detailed.travelAllowance}
                    note="niet belast"
                    color="green"
                  />
                  <div
                    className="rounded-lg px-3 py-2 mt-1 mb-1"
                    style={{ background: "oklch(0.97 0.01 25)" }}
                  >
                    <PayRow
                      label="Premies werknemersaandeel"
                      amount={
                        -detailed.totalPremies *
                        (detailed.grossBase /
                          (detailed.grossBase +
                            (detailed.grossDelayed || 1e-9)))
                      }
                      note="pensioen + WIA + SOOB + Whk"
                      color="red"
                    />
                    <div className="grid grid-cols-2 gap-x-4 mt-1 pl-2">
                      <span
                        className="text-[11px]"
                        style={{ color: "oklch(0.55 0.06 25)" }}
                      >
                        Pensioen {settings.pensionPct}%: -
                        {formatCurrency(
                          (detailed.premiePensioen * detailed.grossBase) /
                            (detailed.grossBase +
                              detailed.grossDelayed +
                              0.001),
                        )}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "oklch(0.55 0.06 25)" }}
                      >
                        WIA-Hiaat {settings.wiaHiaatPct}%: -
                        {formatCurrency(
                          (detailed.premieWIA * detailed.grossBase) /
                            (detailed.grossBase +
                              detailed.grossDelayed +
                              0.001),
                        )}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "oklch(0.55 0.06 25)" }}
                      >
                        SOOB {settings.soobPct}%: -
                        {formatCurrency(
                          (detailed.premieSOOB * detailed.grossBase) /
                            (detailed.grossBase +
                              detailed.grossDelayed +
                              0.001),
                        )}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "oklch(0.55 0.06 25)" }}
                      >
                        Whk {settings.whkPct}%: -
                        {formatCurrency(
                          (detailed.premieWhk * detailed.grossBase) /
                            (detailed.grossBase +
                              detailed.grossDelayed +
                              0.001),
                        )}
                      </span>
                    </div>
                  </div>
                  <PayRow
                    label="Loonheffing (laag door kortingen)"
                    amount={-detailed.loonheffingBase}
                    note={`~${detailed.effectiveRateBase.toFixed(1)}% effectief`}
                    color="red"
                  />
                  <div
                    className="rounded-lg px-3 py-1.5 mt-1"
                    style={{ background: "oklch(0.96 0.04 145)" }}
                  >
                    <p
                      className="text-[11px]"
                      style={{ color: "oklch(0.44 0.12 145)" }}
                    >
                      Schijf 1 (35,75%) − algemene heffingskorting (−
                      {formatCurrency(detailed.algHeffingskorting)}/wk) −
                      arbeidskorting (−{formatCurrency(detailed.arbeidskorting)}
                      /wk)
                    </p>
                  </div>
                  <div
                    className="mt-2 pt-2 border-t flex items-center justify-between"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      className="text-[13px] font-bold"
                      style={{ color: "oklch(0.30 0.12 220)" }}
                    >
                      = Netto deze periode
                    </span>
                    <span
                      className="text-base font-bold tabular-nums"
                      style={{ color: "oklch(0.30 0.16 145)" }}
                    >
                      {formatCurrency(detailed.netThisWeek)}
                    </span>
                  </div>

                  {/* ── Uitgestelde uitbetaling ──────────────────── */}
                  {detailed.grossDelayed > 0 && (
                    <>
                      <SectionDivider label="Uitgestelde uitbetaling (volgende periode)" />
                      <PayRow
                        label="Bruto overuren & toeslagen"
                        amount={detailed.grossDelayed}
                        note="zat/zon/overuren/nacht"
                      />
                      {weekExtra.weekdayOvertimePay > 0 && (
                        <PayRow
                          label={"  · Doordeweeks overuren (130%)"}
                          amount={weekExtra.weekdayOvertimePay}
                          color="muted"
                        />
                      )}
                      {weekExtra.saturdayPay > 0 && (
                        <PayRow
                          label={"  · Zaterdag (150%)"}
                          amount={weekExtra.saturdayPay}
                          color="muted"
                        />
                      )}
                      {weekExtra.sundayPay > 0 && (
                        <PayRow
                          label={"  · Zondag (200%)"}
                          amount={weekExtra.sundayPay}
                          color="muted"
                        />
                      )}
                      {weekExtra.nightPay > 0 && (
                        <PayRow
                          label={`  · Nachttoeslag (+${settings.nightSupplementPct}%)`}
                          amount={weekExtra.nightPay}
                          color="muted"
                        />
                      )}
                      <PayRow
                        label="Premies (proportioneel deel)"
                        amount={
                          -(
                            detailed.totalPremies *
                            (detailed.grossDelayed /
                              (detailed.grossBase +
                                detailed.grossDelayed +
                                0.001))
                          )
                        }
                        color="red"
                      />
                      <PayRow
                        label="Loonheffing bijzonder tarief"
                        amount={-detailed.loonheffingDelayed}
                        note={`${settings.loonheffingPct}% — geen kortingen`}
                        color="red"
                      />
                      <div
                        className="mt-2 pt-2 border-t flex items-center justify-between"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span
                          className="text-[13px] font-bold"
                          style={{ color: "oklch(0.44 0.16 55)" }}
                        >
                          = Netto volgende periode
                        </span>
                        <span
                          className="text-base font-bold tabular-nums"
                          style={{ color: "oklch(0.40 0.20 55)" }}
                        >
                          {formatCurrency(detailed.netDelayed)}
                        </span>
                      </div>
                    </>
                  )}

                  {/* ── Vakantiegeld opbouw ──────────────────────── */}
                  <SectionDivider label="Vakantiegeld opbouw" />
                  <PayRow
                    label={`Opbouw ${settings.vacationPayPct}% over bruto (excl. reiskosten)`}
                    amount={detailed.vacationAccrual}
                    note="wordt later uitbetaald"
                    color="muted"
                  />

                  {/* ── Totaal ──────────────────────────────────── */}
                  <SectionDivider label="Totaal" />
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className="text-[14px] font-bold"
                      style={{ color: "var(--foreground)" }}
                    >
                      Geschat netto totaal (beide periodes)
                    </span>
                    <span
                      className="text-xl font-bold tabular-nums"
                      style={{ color: "oklch(0.36 0.20 145)" }}
                    >
                      {formatCurrency(detailed.netTotal)}
                    </span>
                  </div>
                </div>

                {/* ── Jaarprognose ──────────────────────────────── */}
                <div
                  className="mt-3 rounded-xl border p-4"
                  style={{
                    background: "oklch(0.97 0.02 280)",
                    borderColor: "oklch(0.88 0.05 280)",
                  }}
                  data-ocid="week.jaarprognose.card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp
                      className="w-4 h-4"
                      style={{ color: "oklch(0.44 0.12 280)" }}
                    />
                    <p
                      className="text-[11px] font-bold uppercase tracking-wide"
                      style={{ color: "oklch(0.44 0.12 280)" }}
                    >
                      Jaarprognose (op basis van basisuren)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                        style={{ color: "oklch(0.54 0.09 280)" }}
                      >
                        Bruto jaarsalaris
                      </p>
                      <p
                        className="text-base font-bold tabular-nums"
                        style={{ color: "oklch(0.36 0.12 280)" }}
                      >
                        {formatCurrency(detailed.estimatedAnnualGross)}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "oklch(0.56 0.08 280)" }}
                      >
                        24u × €{settings.hourlyRate.toFixed(2)} × 52 weken
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                        style={{ color: "oklch(0.54 0.09 280)" }}
                      >
                        Geschat netto jaar
                      </p>
                      <p
                        className="text-base font-bold tabular-nums"
                        style={{ color: "oklch(0.36 0.14 145)" }}
                      >
                        {formatCurrency(detailed.netThisWeek * 52)}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "oklch(0.56 0.08 280)" }}
                      >
                        alleen basis, excl. overuren
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                        style={{ color: "oklch(0.54 0.09 280)" }}
                      >
                        Belastingschijf
                      </p>
                      <p
                        className="text-base font-bold tabular-nums"
                        style={{ color: "oklch(0.36 0.12 280)" }}
                      >
                        Schijf 1 — 35,75%
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "oklch(0.56 0.08 280)" }}
                      >
                        onder €38.883 (2026)
                      </p>
                    </div>
                  </div>
                  <div
                    className="mt-3 pt-3 border-t text-[11px]"
                    style={{
                      borderColor: "oklch(0.86 0.05 280)",
                      color: "oklch(0.52 0.09 280)",
                    }}
                  >
                    <strong>Let op:</strong> Overuren en toeslagen worden belast
                    tegen bijzonder tarief van 40,20% (geen heffingskortingen).
                    Jaarinkomen boven €38.883 valt in schijf 2 (49,50%).
                  </div>
                </div>

                {/* Payslip comparison */}
                <div
                  className="mt-3 rounded-xl border overflow-hidden"
                  style={{
                    borderColor: "var(--border)",
                  }}
                  data-ocid="week.payslip.card"
                >
                  <button
                    type="button"
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setShowPayslipComparison((v) => !v)}
                    data-ocid="week.payslip.toggle"
                  >
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: "oklch(0.38 0.10 240)" }}
                    >
                      🧾 Vergelijk met je echte loonstrook
                    </span>
                    {showPayslipComparison ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showPayslipComparison && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          className="px-4 pb-4 border-t border-border"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <p className="text-[12px] text-muted-foreground mt-3 mb-3">
                            Voer je echte loonstrook-bedragen in om de app te
                            kalibreren.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <Label
                                className="text-[12px] font-medium mb-1 block"
                                style={{ color: "oklch(0.40 0.08 240)" }}
                              >
                                Werkelijk netto deze periode (€)
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={payslipThisPeriod}
                                onChange={(e) =>
                                  setPayslipThisPeriod(e.target.value)
                                }
                                placeholder={formatCurrency(
                                  detailed.netThisWeek,
                                )
                                  .replace("€", "")
                                  .trim()}
                                className="h-9"
                                data-ocid="week.payslip.input"
                              />
                              {payslipThisPeriod &&
                                (() => {
                                  const actual =
                                    Number.parseFloat(payslipThisPeriod);
                                  const diff = actual - detailed.netThisWeek;
                                  const absDiff = Math.abs(diff);
                                  const color =
                                    absDiff <= 20
                                      ? "oklch(0.40 0.18 145)"
                                      : absDiff <= 50
                                        ? "oklch(0.52 0.18 55)"
                                        : "oklch(0.48 0.20 25)";
                                  return (
                                    <p
                                      className="text-[11px] mt-1 font-medium"
                                      style={{ color }}
                                    >
                                      {diff >= 0 ? "+" : ""}
                                      {formatCurrency(diff)} verschil (
                                      {absDiff <= 20
                                        ? "✓ klopt goed"
                                        : absDiff <= 50
                                          ? "⚠ kleine afwijking"
                                          : "✗ grote afwijking"}
                                      )
                                    </p>
                                  );
                                })()}
                            </div>
                            <div>
                              <Label
                                className="text-[12px] font-medium mb-1 block"
                                style={{ color: "oklch(0.40 0.08 240)" }}
                              >
                                Werkelijk netto volgende periode (€)
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={payslipNextPeriod}
                                onChange={(e) =>
                                  setPayslipNextPeriod(e.target.value)
                                }
                                placeholder={
                                  detailed.grossDelayed > 0
                                    ? formatCurrency(detailed.netDelayed)
                                        .replace("€", "")
                                        .trim()
                                    : "0"
                                }
                                className="h-9"
                                data-ocid="week.payslip.input"
                              />
                              {payslipNextPeriod &&
                                detailed.grossDelayed > 0 &&
                                (() => {
                                  const actual =
                                    Number.parseFloat(payslipNextPeriod);
                                  const diff = actual - detailed.netDelayed;
                                  const absDiff = Math.abs(diff);
                                  const color =
                                    absDiff <= 20
                                      ? "oklch(0.40 0.18 145)"
                                      : absDiff <= 50
                                        ? "oklch(0.52 0.18 55)"
                                        : "oklch(0.48 0.20 25)";
                                  return (
                                    <p
                                      className="text-[11px] mt-1 font-medium"
                                      style={{ color }}
                                    >
                                      {diff >= 0 ? "+" : ""}
                                      {formatCurrency(diff)} verschil (
                                      {absDiff <= 20
                                        ? "✓ klopt goed"
                                        : absDiff <= 50
                                          ? "⚠ kleine afwijking"
                                          : "✗ grote afwijking"}
                                      )
                                    </p>
                                  );
                                })()}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
