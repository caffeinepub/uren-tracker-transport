import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Car,
  ChevronDown,
  ChevronRight,
  Info,
  Moon,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { DayCalculation, Settings } from "../types";
import {
  calculateWeekExtra,
  formatCurrency,
  formatHours,
} from "../utils/calculations";

interface WeekExtraCardProps {
  calculations: DayCalculation[];
  settings: Settings;
  weekNum: number;
}

export function WeekExtraCard({
  calculations,
  settings,
  weekNum,
}: WeekExtraCardProps) {
  const [showCalc, setShowCalc] = useState(false);
  const extra = calculateWeekExtra(calculations, settings);
  const {
    standardPay,
    extraPay,
    nightPay,
    travelPay,
    weeklyBonus,
    saturdayHours,
    saturdayPay,
    sundayHours,
    sundayPay,
    weekdayNormalHours,
    weekdayOvertimeHours,
    weekdayOvertimePay,
    overtimeTriggered,
    totalHours,
  } = extra;

  const hasExtra = extraPay > 0;
  const fourWeekBase = settings.hourlyRate * 96;
  const CONTRACT_HOURS = 24;
  const totalWeekdayHours = weekdayNormalHours + weekdayOvertimeHours;
  const weekendTotal = saturdayHours + sundayHours;

  const buildNoteText = () => {
    const parts: string[] = [];
    if (weekdayNormalHours > 0)
      parts.push(`${formatHours(weekdayNormalHours)} doordeweeks normaal`);
    if (weekdayOvertimeHours > 0)
      parts.push(`${formatHours(weekdayOvertimeHours)} overuren (130%)`);
    if (saturdayHours > 0)
      parts.push(`${formatHours(saturdayHours)} za à 150%`);
    if (sundayHours > 0) parts.push(`${formatHours(sundayHours)} zo à 200%`);
    const base = parts.join(" + ");
    if (!base) return "Nog geen uren ingevoerd.";
    return `Week ${weekNum}: ${base} → ${formatCurrency(extraPay)} extra verdiend (uitbetaling volgende periode)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      <Card
        className="overflow-hidden border-border shadow-card rounded-xl mb-4"
        data-ocid="week.extra.card"
        style={{
          background: "oklch(0.97 0.04 145)",
          borderColor: "oklch(0.82 0.09 145)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-3.5 border-b flex items-center gap-2"
          style={{ borderColor: "oklch(0.82 0.09 145)" }}
        >
          <Zap className="w-4 h-4" style={{ color: "oklch(0.52 0.18 145)" }} />
          <h3
            className="font-semibold text-[15px]"
            style={{ color: "oklch(0.30 0.12 145)" }}
          >
            Week {weekNum} — Simpel Overzicht
          </h3>
          <div className="ml-auto flex items-center gap-1.5">
            <Info
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.52 0.18 145)" }}
            />
            <span
              className="text-[11px]"
              style={{ color: "oklch(0.52 0.18 145)" }}
            >
              Jouw week in één oogopslag
            </span>
          </div>
        </div>

        <div className="p-5">
          {/* Two big numbers */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Standaardloon */}
            <div
              className="rounded-xl p-4 border"
              style={{
                background: "oklch(0.99 0.01 145)",
                borderColor: "oklch(0.86 0.06 145)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: "oklch(0.52 0.10 145)" }}
              >
                Standaardloon
              </p>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: "oklch(0.30 0.10 145)" }}
              >
                {formatCurrency(standardPay)}
              </p>
              <p
                className="text-[12px] mt-0.5"
                style={{ color: "oklch(0.55 0.08 145)" }}
              >
                vast (24u basis)
              </p>
            </div>

            {/* Extra verdiend */}
            <div
              className="rounded-xl p-4 border relative overflow-hidden"
              style={{
                background: hasExtra
                  ? "oklch(0.93 0.10 145)"
                  : "oklch(0.99 0.01 145)",
                borderColor: hasExtra
                  ? "oklch(0.72 0.18 145)"
                  : "oklch(0.86 0.06 145)",
              }}
            >
              {hasExtra && (
                <div
                  className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20"
                  style={{ background: "oklch(0.62 0.22 145)" }}
                />
              )}
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-1"
                style={{
                  color: hasExtra
                    ? "oklch(0.40 0.18 145)"
                    : "oklch(0.52 0.10 145)",
                }}
              >
                Extra verdiend
              </p>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{
                  color: hasExtra
                    ? "oklch(0.38 0.22 145)"
                    : "oklch(0.55 0.08 145)",
                }}
              >
                {formatCurrency(extraPay)}
              </p>
              <p
                className="text-[12px] mt-0.5"
                style={{
                  color: hasExtra
                    ? "oklch(0.45 0.16 145)"
                    : "oklch(0.60 0.06 145)",
                }}
              >
                wordt later uitbetaald
              </p>
            </div>
          </div>

          {/* Kaal basisloon per 4 weken */}
          <div
            className="rounded-xl p-4 border mb-4 flex items-center justify-between gap-4"
            style={{
              background: "oklch(0.98 0.015 220)",
              borderColor: "oklch(0.84 0.05 220)",
            }}
          >
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: "oklch(0.48 0.09 220)" }}
              >
                Kaal basisloon per 4 weken
              </p>
              <p
                className="text-[12px]"
                style={{ color: "oklch(0.55 0.07 220)" }}
              >
                24 uur/week × 4 weken (60% parttime)
              </p>
            </div>
            <p
              className="text-2xl font-bold tabular-nums shrink-0"
              style={{ color: "oklch(0.28 0.10 220)" }}
            >
              {formatCurrency(fourWeekBase)}
            </p>
          </div>

          {/* ── Per-categorie breakdown ── */}
          {totalHours > 0 && (
            <div
              className="rounded-xl border mb-3 overflow-hidden"
              style={{
                borderColor: "oklch(0.82 0.09 145)",
                background: "oklch(0.99 0.01 145)",
              }}
            >
              {/* Section header */}
              <div
                className="px-4 py-2 border-b"
                style={{
                  borderColor: "oklch(0.88 0.06 145)",
                  background: "oklch(0.96 0.03 145)",
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: "oklch(0.45 0.12 145)" }}
                >
                  Week {weekNum} — Urenverdeling
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "oklch(0.52 0.08 145)" }}
                >
                  Doordeweeks: eerste {CONTRACT_HOURS}u = 100%. Boven{" "}
                  {CONTRACT_HOURS}u doordeweeks = 130%. Zaterdag/zondag altijd
                  eigen toeslag — tellen nooit mee voor de {CONTRACT_HOURS}u
                  drempel.
                </p>
              </div>

              <div
                className="divide-y"
                style={{ borderColor: "oklch(0.93 0.04 145)" }}
              >
                {/* Contractdrempel rij */}
                <div
                  className="flex items-center justify-between px-4 py-2 gap-3"
                  style={{
                    background: "oklch(0.96 0.02 220)",
                    borderBottom: "1px solid oklch(0.90 0.04 220)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-12 h-5 rounded text-[10px] font-bold"
                      style={{
                        background: "oklch(0.88 0.06 220)",
                        color: "oklch(0.38 0.10 220)",
                      }}
                    >
                      24u
                    </span>
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: "oklch(0.38 0.09 220)" }}
                    >
                      Contractdrempel doordeweeks (ma–vr)
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded"
                    style={{
                      background: "oklch(0.90 0.10 55)",
                      color: "oklch(0.38 0.18 55)",
                    }}
                  >
                    boven dit → 130%
                  </span>
                </div>

                {/* Doordeweeks normaal */}
                {weekdayNormalHours > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-12 h-5 rounded text-[10px] font-bold"
                        style={{
                          background: "oklch(0.92 0.04 145)",
                          color: "oklch(0.40 0.12 145)",
                        }}
                      >
                        100%
                      </span>
                      <span
                        className="text-[13px]"
                        style={{ color: "oklch(0.35 0.08 145)" }}
                      >
                        {formatHours(weekdayNormalHours)} doordeweeks normaal
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ color: "oklch(0.35 0.10 145)" }}
                    >
                      {formatCurrency(weekdayNormalHours * settings.hourlyRate)}
                    </span>
                  </div>
                )}

                {/* Doordeweeks overuren (130%) */}
                {weekdayOvertimeHours > 0 && (
                  <div
                    className="flex items-center justify-between px-4 py-2.5 gap-3"
                    style={{ background: "oklch(0.97 0.04 55)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-12 h-5 rounded text-[10px] font-bold"
                        style={{
                          background: "oklch(0.90 0.10 55)",
                          color: "oklch(0.38 0.18 55)",
                        }}
                      >
                        130%
                      </span>
                      <span
                        className="text-[13px]"
                        style={{ color: "oklch(0.38 0.12 55)" }}
                      >
                        {formatHours(weekdayOvertimeHours)} doordeweeks overuren
                      </span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          background: "oklch(0.88 0.12 55)",
                          color: "oklch(0.38 0.18 55)",
                        }}
                      >
                        +{settings.weeklyOvertimeBonusPct}% bonus
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ color: "oklch(0.35 0.18 55)" }}
                    >
                      {formatCurrency(weekdayOvertimePay)}
                    </span>
                  </div>
                )}

                {/* Zaterdag (150%) */}
                {saturdayHours > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-12 h-5 rounded text-[10px] font-bold"
                        style={{
                          background: "oklch(0.90 0.10 40)",
                          color: "oklch(0.38 0.18 40)",
                        }}
                      >
                        150%
                      </span>
                      <span
                        className="text-[13px]"
                        style={{ color: "oklch(0.35 0.08 145)" }}
                      >
                        {formatHours(saturdayHours)} zaterdag
                      </span>
                      <span
                        className="text-[10px] italic"
                        style={{ color: "oklch(0.58 0.07 145)" }}
                      >
                        (geen overurentoeslag)
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ color: "oklch(0.35 0.10 145)" }}
                    >
                      {formatCurrency(saturdayPay)}
                    </span>
                  </div>
                )}

                {/* Zondag (200%) */}
                {sundayHours > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-12 h-5 rounded text-[10px] font-bold"
                        style={{
                          background: "oklch(0.88 0.14 300)",
                          color: "oklch(0.36 0.18 300)",
                        }}
                      >
                        200%
                      </span>
                      <span
                        className="text-[13px]"
                        style={{ color: "oklch(0.35 0.08 145)" }}
                      >
                        {formatHours(sundayHours)} zondag
                      </span>
                      <span
                        className="text-[10px] italic"
                        style={{ color: "oklch(0.58 0.07 145)" }}
                      >
                        (geen overurentoeslag)
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ color: "oklch(0.35 0.10 145)" }}
                    >
                      {formatCurrency(sundayPay)}
                    </span>
                  </div>
                )}

                {/* Nachttoeslag */}
                {nightPay > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <div className="flex items-center gap-2">
                      <Moon
                        className="w-3.5 h-3.5"
                        style={{ color: "oklch(0.45 0.14 260)" }}
                      />
                      <span
                        className="text-[13px]"
                        style={{ color: "oklch(0.35 0.08 145)" }}
                      >
                        Nachttoeslag (+{settings.nightSupplementPct}%)
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ color: "oklch(0.35 0.10 145)" }}
                    >
                      {formatCurrency(nightPay)}
                    </span>
                  </div>
                )}

                {/* Reiskosten */}
                {travelPay > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <div className="flex items-center gap-2">
                      <Car
                        className="w-3.5 h-3.5"
                        style={{ color: "oklch(0.50 0.10 200)" }}
                      />
                      <span
                        className="text-[13px]"
                        style={{ color: "oklch(0.35 0.08 145)" }}
                      >
                        Reiskosten
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ color: "oklch(0.35 0.10 145)" }}
                    >
                      {formatCurrency(travelPay)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Transparency: Stap-voor-stap berekening ── */}
          {totalHours > 0 && (
            <Collapsible open={showCalc} onOpenChange={setShowCalc}>
              <CollapsibleTrigger
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left mb-1 transition-colors"
                style={{
                  background: showCalc
                    ? "oklch(0.94 0.04 220)"
                    : "oklch(0.96 0.02 220)",
                  border: "1px solid oklch(0.86 0.05 220)",
                  color: "oklch(0.40 0.09 220)",
                }}
                data-ocid="week.calc.toggle"
              >
                {showCalc ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="text-[12px] font-semibold">
                  Zo rekent de app — stap-voor-stap uitleg
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg px-4 py-3 mb-3"
                  style={{
                    background: "oklch(0.975 0.015 220)",
                    border: "1px solid oklch(0.87 0.05 220)",
                    color: "oklch(0.38 0.08 220)",
                  }}
                >
                  {/* Step 1: Doordeweekse uren vs 24u */}
                  <div className="mb-3">
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                      style={{ color: "oklch(0.50 0.10 220)" }}
                    >
                      Stap 1 — Doordeweekse uren (ma–vr) vs. 24u contract
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[12px]">
                        <span>Doordeweekse uren (ma–vr, na pauze)</span>
                        <span className="font-semibold tabular-nums">
                          {formatHours(totalWeekdayHours)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span>Contracturen per week</span>
                        <span className="font-semibold tabular-nums">
                          {CONTRACT_HOURS}u
                        </span>
                      </div>
                      <div
                        className="flex justify-between text-[12px] pt-1 border-t"
                        style={{ borderColor: "oklch(0.86 0.05 220)" }}
                      >
                        <span>Doordeweeks normaal (100%)</span>
                        <span className="font-semibold tabular-nums">
                          {formatHours(weekdayNormalHours)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between text-[12px] font-bold"
                        style={{
                          color:
                            weekdayOvertimeHours > 0
                              ? "oklch(0.40 0.18 55)"
                              : "inherit",
                        }}
                      >
                        <span>
                          Doordeweeks overuren (130%) — boven {CONTRACT_HOURS}u
                        </span>
                        <span className="tabular-nums">
                          {weekdayOvertimeHours > 0
                            ? `+${formatHours(weekdayOvertimeHours)}`
                            : "geen"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div
                    className="border-t my-2"
                    style={{ borderColor: "oklch(0.88 0.04 220)" }}
                  />

                  {/* Step 2: Weekend — volledig apart */}
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                      style={{ color: "oklch(0.50 0.10 220)" }}
                    >
                      Stap 2 — Weekend (volledig apart, telt NIET mee voor 24u)
                    </p>
                    <div className="space-y-1">
                      {saturdayHours > 0 && (
                        <div className="flex justify-between text-[12px]">
                          <span>
                            Zaterdag{" "}
                            <span
                              className="px-1 py-0.5 rounded text-[10px] font-bold ml-1"
                              style={{
                                background: "oklch(0.90 0.10 40)",
                                color: "oklch(0.38 0.18 40)",
                              }}
                            >
                              150%
                            </span>
                            <span
                              className="text-[10px] ml-1 italic"
                              style={{ color: "oklch(0.55 0.07 220)" }}
                            >
                              (altijd, geen overurentoeslag)
                            </span>
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatHours(saturdayHours)}
                          </span>
                        </div>
                      )}
                      {sundayHours > 0 && (
                        <div className="flex justify-between text-[12px]">
                          <span>
                            Zondag{" "}
                            <span
                              className="px-1 py-0.5 rounded text-[10px] font-bold ml-1"
                              style={{
                                background: "oklch(0.88 0.14 300)",
                                color: "oklch(0.36 0.18 300)",
                              }}
                            >
                              200%
                            </span>
                            <span
                              className="text-[10px] ml-1 italic"
                              style={{ color: "oklch(0.55 0.07 220)" }}
                            >
                              (altijd, geen overurentoeslag)
                            </span>
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatHours(sundayHours)}
                          </span>
                        </div>
                      )}
                      {weekendTotal === 0 && (
                        <p
                          className="text-[12px] italic"
                          style={{ color: "oklch(0.60 0.06 220)" }}
                        >
                          Geen weekenduren deze week
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conclusion */}
                  <div
                    className="mt-3 pt-2 border-t rounded text-[11px] leading-relaxed"
                    style={{
                      borderColor: "oklch(0.86 0.05 220)",
                      color: "oklch(0.45 0.08 220)",
                    }}
                  >
                    <strong>Samenvatting:</strong> Doordeweeks eerste{" "}
                    {CONTRACT_HOURS}u = 100%. Doordeweeks boven {CONTRACT_HOURS}
                    u = 130% (+30% bonus). Zaterdag = altijd 150%. Zondag =
                    altijd 200%. Weekend telt <em>nooit</em> mee voor de{" "}
                    {CONTRACT_HOURS}u drempel.
                  </div>
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Badges */}
          {hasExtra && (
            <div className="flex flex-wrap gap-2 mb-4">
              {overtimeTriggered && weeklyBonus > 0 && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium"
                  style={{
                    background: "oklch(0.90 0.10 55)",
                    color: "oklch(0.35 0.18 55)",
                    border: "1px solid oklch(0.78 0.14 55)",
                  }}
                >
                  <TrendingUp className="w-3 h-3" />
                  Weekbonus (+{settings.weeklyOvertimeBonusPct}%):{" "}
                  {formatCurrency(weeklyBonus)}
                </Badge>
              )}
              {saturdayPay > 0 && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium"
                  style={{
                    background: "oklch(0.90 0.10 40)",
                    color: "oklch(0.34 0.16 40)",
                    border: "1px solid oklch(0.78 0.12 40)",
                  }}
                >
                  <Star className="w-3 h-3" />
                  Zaterdag (150%): {formatCurrency(saturdayPay)}
                </Badge>
              )}
              {sundayPay > 0 && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium"
                  style={{
                    background: "oklch(0.90 0.10 300)",
                    color: "oklch(0.34 0.14 300)",
                    border: "1px solid oklch(0.78 0.10 300)",
                  }}
                >
                  <Star className="w-3 h-3" />
                  Zondag (200%): {formatCurrency(sundayPay)}
                </Badge>
              )}
              {nightPay > 0 && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium"
                  style={{
                    background: "oklch(0.88 0.12 145)",
                    color: "oklch(0.32 0.18 145)",
                    border: "1px solid oklch(0.76 0.14 145)",
                  }}
                >
                  <Moon className="w-3 h-3" />
                  Avond/Nacht: {formatCurrency(nightPay)}
                </Badge>
              )}
              {travelPay > 0 && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium"
                  style={{
                    background: "oklch(0.88 0.12 145)",
                    color: "oklch(0.32 0.18 145)",
                    border: "1px solid oklch(0.76 0.14 145)",
                  }}
                >
                  <Car className="w-3 h-3" />
                  Reiskosten: {formatCurrency(travelPay)}
                </Badge>
              )}
            </div>
          )}

          {/* Bottom note */}
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: "oklch(0.52 0.10 145)" }}
          >
            {buildNoteText()}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
