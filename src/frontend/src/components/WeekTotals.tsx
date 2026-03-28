import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Award,
  BadgeCheck,
  Car,
  Clock,
  Download,
  Euro,
  Moon,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import type { DayCalculation, Settings } from "../types";
import {
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
}

export function WeekTotals({
  calculations,
  hourlyRate: _hourlyRate,
  weeklyOvertimeBonusPct = 30,
  settings,
  weekNum,
  weekDates,
}: WeekTotalsProps) {
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
    </motion.div>
  );
}
