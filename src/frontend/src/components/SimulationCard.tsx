import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, FlaskConical } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Settings } from "../types";
import { formatCurrency } from "../utils/calculations";

interface SimulationCardProps {
  settings: Settings;
}

export function SimulationCard({ settings }: SimulationCardProps) {
  const [open, setOpen] = useState(false);
  const [extraOvertime, setExtraOvertime] = useState(0);
  const [extraNight, setExtraNight] = useState(0);

  const extraOvertimePay =
    extraOvertime * settings.hourlyRate * (settings.overtimeWeekday1Pct / 100);
  const extraNightPay =
    extraNight * settings.hourlyRate * (settings.nightSupplementPct / 100);
  const totalExtra = extraOvertimePay + extraNightPay;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.45 }}
      className="mt-4"
    >
      <Card
        className="overflow-hidden border-border shadow-card rounded-xl"
        data-ocid="simulation.card"
        style={{
          background: "oklch(0.97 0.02 265)",
          borderColor: "oklch(0.84 0.05 265)",
        }}
      >
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full px-5 py-3.5 flex items-center gap-2 text-left transition-colors hover:brightness-95"
          data-ocid="simulation.toggle"
        >
          <FlaskConical
            className="w-4 h-4 shrink-0"
            style={{ color: "oklch(0.52 0.14 265)" }}
          />
          <h3
            className="font-semibold text-[15px] flex-1"
            style={{ color: "oklch(0.30 0.10 265)" }}
          >
            Simulatie — Wat als ik extra uren maak?
          </h3>
          {open ? (
            <ChevronUp
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.14 265)" }}
            />
          ) : (
            <ChevronDown
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.14 265)" }}
            />
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="sim-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div
                className="border-t px-5 py-4"
                style={{ borderColor: "oklch(0.84 0.05 265)" }}
              >
                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <Label
                      className="text-[12px] font-medium mb-1.5 block"
                      style={{ color: "oklch(0.40 0.10 265)" }}
                    >
                      Extra overuren (uren)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={40}
                      step={0.5}
                      value={extraOvertime || ""}
                      onChange={(e) =>
                        setExtraOvertime(Number(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="h-9"
                      data-ocid="simulation.overtime.input"
                    />
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "oklch(0.60 0.08 265)" }}
                    >
                      Toeslag: {settings.overtimeWeekday1Pct}% van uurloon
                    </p>
                  </div>
                  <div>
                    <Label
                      className="text-[12px] font-medium mb-1.5 block"
                      style={{ color: "oklch(0.40 0.10 265)" }}
                    >
                      Extra nachturen na {settings.nightStartHour}:00
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={extraNight || ""}
                      onChange={(e) =>
                        setExtraNight(Number(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="h-9"
                      data-ocid="simulation.night.input"
                    />
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "oklch(0.60 0.08 265)" }}
                    >
                      Nachttoeslag: {settings.nightSupplementPct}% bovenop
                      uurloon
                    </p>
                  </div>
                </div>

                {/* Results */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background:
                      totalExtra > 0
                        ? "oklch(0.93 0.06 265)"
                        : "oklch(0.99 0.01 265)",
                    borderColor:
                      totalExtra > 0
                        ? "oklch(0.75 0.12 265)"
                        : "oklch(0.88 0.03 265)",
                  }}
                >
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p
                        className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
                        style={{ color: "oklch(0.55 0.10 265)" }}
                      >
                        Overurenloon
                      </p>
                      <p
                        className="text-lg font-bold tabular-nums"
                        style={{ color: "oklch(0.32 0.14 265)" }}
                      >
                        {formatCurrency(extraOvertimePay)}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
                        style={{ color: "oklch(0.55 0.10 265)" }}
                      >
                        Nachttoeslag
                      </p>
                      <p
                        className="text-lg font-bold tabular-nums"
                        style={{ color: "oklch(0.32 0.14 265)" }}
                      >
                        {formatCurrency(extraNightPay)}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
                        style={{ color: "oklch(0.40 0.18 265)" }}
                      >
                        Totaal extra
                      </p>
                      <p
                        className="text-lg font-bold tabular-nums"
                        style={{
                          color:
                            totalExtra > 0
                              ? "oklch(0.32 0.18 265)"
                              : "oklch(0.55 0.06 265)",
                        }}
                      >
                        {formatCurrency(totalExtra)}
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-[12px] leading-relaxed"
                    style={{ color: "oklch(0.45 0.10 265)" }}
                  >
                    {extraOvertime > 0 || extraNight > 0
                      ? `Als je ${extraOvertime > 0 ? `${extraOvertime} overur${extraOvertime === 1 ? "" : "en"}` : ""}${extraOvertime > 0 && extraNight > 0 ? " + " : ""}${extraNight > 0 ? `${extraNight} nachtuur${extraNight === 1 ? "" : ""} na ${settings.nightStartHour}:00` : ""} extra maakt, verdien je ongeveer ${formatCurrency(totalExtra)} extra deze week.`
                      : "Vul het aantal uren in om je potentiële extra verdienste te berekenen."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
