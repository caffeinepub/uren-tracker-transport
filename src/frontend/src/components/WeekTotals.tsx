import { Card } from "@/components/ui/card";
import { Award, Car, Clock, Euro, Percent, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import type { DayCalculation } from "../types";
import {
  calculateWeeklyOvertimeBonus,
  formatCurrency,
  formatHours,
} from "../utils/calculations";

interface WeekTotalsProps {
  calculations: DayCalculation[];
  hourlyRate: number;
}

export function WeekTotals({ calculations, hourlyRate }: WeekTotalsProps) {
  const totals = calculations.reduce(
    (acc, c) => ({
      workedHours: acc.workedHours + c.workedHours,
      baseHours: acc.baseHours + c.baseHours,
      overtimeHours: acc.overtimeHours + c.overtimeHours,
      travelTotal: acc.travelTotal + c.travelAllowance,
      totalEarned: acc.totalEarned + c.totalEarned,
    }),
    {
      workedHours: 0,
      baseHours: 0,
      overtimeHours: 0,
      travelTotal: 0,
      totalEarned: 0,
    },
  );

  const toeslagen = calculations.reduce(
    (acc, c) => acc + c.eveningNightPay + c.dayOfWeekSupplement,
    0,
  );

  const weeklyBonus = calculateWeeklyOvertimeBonus(calculations, hourlyRate);
  const grandTotal = totals.totalEarned + weeklyBonus;
  const totalHours = totals.workedHours;
  const above24 = totalHours > 24;

  const items = [
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Totaal uren",
      value: formatHours(totals.workedHours),
      sub: above24 ? "⚡ boven 24u" : "gewerkt",
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
      label: "Overuren",
      value: formatHours(totals.overtimeHours),
      sub: "extra",
      highlight: totals.overtimeHours > 0,
    },
    {
      icon: <Euro className="w-4 h-4" />,
      label: "Bruto loon",
      value: formatCurrency(grandTotal),
      sub: weeklyBonus > 0 ? "incl. +30% bonus" : "incl. alles",
      highlight: true,
      large: true,
    },
    {
      icon: <Percent className="w-4 h-4" />,
      label: "Toeslagen",
      value: formatCurrency(toeslagen + weeklyBonus),
      sub: weeklyBonus > 0 ? "weekend + 24u bonus" : "avond/nacht/weekend",
    },
    {
      icon: <Car className="w-4 h-4" />,
      label: "Reiskosten",
      value: formatCurrency(totals.travelTotal),
      sub: "vergoeding",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.32 }}
    >
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
            <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange/10 text-orange">
              +30% bonus actief (boven 24u)
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {item.icon}
                  <span className="text-[11px] font-medium uppercase tracking-wide">
                    {item.label}
                  </span>
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
