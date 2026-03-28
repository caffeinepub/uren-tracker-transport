import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Clock, Coffee, Euro, Percent } from "lucide-react";
import { motion } from "motion/react";
import { useCallback } from "react";
import type { DayEntry } from "../types";
import type { DayCalculation } from "../types";
import { formatCurrency, formatHours } from "../utils/calculations";

interface DayCardProps {
  date: Date;
  dayIndex: number;
  entry: DayEntry;
  calc: DayCalculation;
  onUpdate: (entry: DayEntry) => void;
}

const DAY_NAMES = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];
const MONTH_NAMES = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

export function DayCard({
  date,
  dayIndex,
  entry,
  calc,
  onUpdate,
}: DayCardProps) {
  const dayName = DAY_NAMES[date.getDay()];
  const dateStr = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  const handleChange = useCallback(
    (field: keyof DayEntry, value: string | number) => {
      onUpdate({ ...entry, [field]: value });
    },
    [entry, onUpdate],
  );

  // Correct badge labels: Zaterdag = +50% toeslag (150% totaal), Zondag = +100% toeslag (200% totaal)
  const weekendLabel = date.getDay() === 6 ? "Zaterdag +50%" : "Zondag +100%";

  const breakMinutes = entry.breakMinutes || 0;
  const grossHours =
    breakMinutes > 0 ? calc.workedHours + breakMinutes / 60 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: dayIndex * 0.04 }}
    >
      <Card
        className={`bg-card border rounded-xl shadow-card overflow-hidden ${
          isWeekend ? "border-orange/30" : "border-border"
        }`}
        data-ocid={`day.card.${dayIndex + 1}`}
      >
        {/* Card header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-[15px]">
              {dayName}
            </h3>
            <p className="text-muted-foreground text-[13px]">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            {isWeekend && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange/10 text-orange">
                {weekendLabel}
              </span>
            )}
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                calc.hasData
                  ? "bg-success-bg text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {calc.hasData ? "Ingevuld" : "Niet ingevuld"}
            </span>
          </div>
        </div>

        <div className="p-5">
          {/* Input fields */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <Label className="text-[12px] text-muted-foreground mb-1 block">
                <Clock className="inline w-3 h-3 mr-1" />
                Begintijd
              </Label>
              <Input
                type="time"
                value={entry.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                className="h-9 text-sm"
                data-ocid={`day.input.${dayIndex + 1}`}
              />
            </div>
            <div>
              <Label className="text-[12px] text-muted-foreground mb-1 block">
                <Clock className="inline w-3 h-3 mr-1" />
                Eindtijd
              </Label>
              <Input
                type="time"
                value={entry.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
                className="h-9 text-sm"
                data-ocid={`day.input.${dayIndex + 1}`}
              />
            </div>
            <div>
              <Label className="text-[12px] text-muted-foreground mb-1 block">
                <Coffee className="inline w-3 h-3 mr-1" />
                Pauze (min)
              </Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={entry.breakMinutes || ""}
                onChange={(e) =>
                  handleChange("breakMinutes", Number(e.target.value))
                }
                placeholder="0"
                className="h-9 text-sm"
                data-ocid={`day.input.${dayIndex + 1}`}
              />
            </div>
          </div>

          {/* Results */}
          {calc.hasData && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3 border-t border-border">
              {/* Break deduction breakdown */}
              {grossHours !== null ? (
                <>
                  <ResultRow
                    icon={<Clock className="w-3.5 h-3.5" />}
                    label="Bruto uren"
                    value={formatHours(grossHours)}
                  />
                  <ResultRow
                    icon={<Coffee className="w-3.5 h-3.5" />}
                    label="Pauze"
                    value={`-${breakMinutes} min`}
                    deduction
                  />
                  <ResultRow
                    icon={<Clock className="w-3.5 h-3.5" />}
                    label="Netto werktijd"
                    value={formatHours(calc.workedHours)}
                    highlight
                  />
                </>
              ) : (
                <ResultRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Werktijd"
                  value={formatHours(calc.workedHours)}
                />
              )}
              <ResultRow
                icon={<Euro className="w-3.5 h-3.5" />}
                label="Bruto verdienste"
                value={formatCurrency(calc.totalEarned)}
                highlight
                large
              />
              <ResultRow
                icon={<Percent className="w-3.5 h-3.5" />}
                label="Toeslag"
                value={
                  calc.toeslagPercentage > 0
                    ? `+${calc.toeslagPercentage.toFixed(0)}%`
                    : "—"
                }
              />
              <ResultRow
                icon={<Car className="w-3.5 h-3.5" />}
                label="Reiskosten"
                value={formatCurrency(calc.travelAllowance)}
              />
              {calc.eveningNightPay > 0 && (
                <ResultRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Avond/Nacht"
                  value={`+${formatCurrency(calc.eveningNightPay)}`}
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface ResultRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  large?: boolean;
  deduction?: boolean;
}

function ResultRow({
  icon,
  label,
  value,
  highlight,
  large,
  deduction,
}: ResultRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`shrink-0 ${deduction ? "text-red-400" : "text-muted-foreground"}`}
      >
        {icon}
      </span>
      <span
        className={`text-[12px] flex-1 ${deduction ? "text-red-400" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`font-semibold tabular-nums ${
          large ? "text-[14px]" : "text-[13px]"
        } ${deduction ? "text-red-400" : highlight ? "text-orange" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
