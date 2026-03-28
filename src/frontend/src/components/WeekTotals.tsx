import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Award,
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

  // Use calculateWeekExtra for consistent breakdown
  const weekExtra = calculateWeekExtra(calculations, settings);
  const { weekdayOvertimeHours, saturdayHours, sundayHours, weeklyBonus } =
    weekExtra;

  const totalHours = totals.workedHours;
  const above24 = totalHours > 24;

  const grandTotal = totals.totalEarned + weeklyBonus;
  const netPay = calculateNetPay(grandTotal, settings);

  const hasDelayedItems = weekdayOvertimeHours > 0 || totals.nightHours > 0;

  const items = [
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Totaal uren",
      value: formatHours(totals.workedHours),
      sub: above24 ? `${formatHours(totalHours - 24)} boven 24u` : "gewerkt",
      highlight: above24,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Basis uren",
      value: formatHours(totals.baseHours),
      sub: "normaal",
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
          .join(" · ") || "avond/nacht/weekend",
    },
    {
      icon: <Car className="w-4 h-4" />,
      label: "Reiskosten",
      value: formatCurrency(totals.travelTotal),
      sub: "vergoeding",
    },
    {
      icon: <Percent className="w-4 h-4" />,
      label: "Vakantiegeld",
      value: formatCurrency(totals.vacationPayAccrual),
      sub: `${settings.vacationPayPct}% opbouw`,
    },
    {
      icon: <Wallet className="w-4 h-4" />,
      label: "Netto schatting",
      value: formatCurrency(netPay),
      sub: "na inhoudingen",
      highlight: true,
      large: true,
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
              +{weeklyOvertimeBonusPct}% weekbonus actief (boven 24u)
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-4">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {item.icon}
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
                  } ${item.highlight ? "text-orange" : "text-foreground"}`}
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
