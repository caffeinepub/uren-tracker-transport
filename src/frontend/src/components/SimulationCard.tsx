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
  const [extraSaturday, setExtraSaturday] = useState(0);
  const [extraSunday, setExtraSunday] = useState(0);

  const rate = settings.hourlyRate;
  const totalPremiesPct =
    settings.pensionPct +
    settings.wiaHiaatPct +
    settings.soobPct +
    settings.whkPct;
  const bijzonderTarief = settings.loonheffingPct / 100;

  const calcNet = (bruto: number) => {
    const premies = bruto * (totalPremiesPct / 100);
    const loonheffing = bruto * bijzonderTarief;
    const net = bruto - premies - loonheffing;
    return { bruto, premies, loonheffing, net };
  };

  const overtimeBruto = extraOvertime * rate * 1.3; // 130% = 100% + 30% bonus
  const nightBruto = extraNight * rate * (settings.nightSupplementPct / 100); // just the supplement
  const saturdayBruto = extraSaturday * rate * (settings.saturdayPct / 100);
  const sundayBruto = extraSunday * rate * (settings.sundayPct / 100);
  const totalBruto = overtimeBruto + nightBruto + saturdayBruto + sundayBruto;

  const overtimeNet = calcNet(overtimeBruto);
  const nightNet = calcNet(nightBruto);
  const saturdayNet = calcNet(saturdayBruto);
  const sundayNet = calcNet(sundayBruto);
  const totalNet = calcNet(totalBruto);

  const hasInput =
    extraOvertime > 0 || extraNight > 0 || extraSaturday > 0 || extraSunday > 0;

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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  <div>
                    <Label
                      className="text-[12px] font-medium mb-1.5 block"
                      style={{ color: "oklch(0.40 0.10 265)" }}
                    >
                      Extra overuren (u)
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
                      Doordeweeks boven 24u → 130%
                    </p>
                  </div>
                  <div>
                    <Label
                      className="text-[12px] font-medium mb-1.5 block"
                      style={{ color: "oklch(0.40 0.10 265)" }}
                    >
                      Extra nachturen (u)
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
                      Toeslag: +{settings.nightSupplementPct}%
                    </p>
                  </div>
                  <div>
                    <Label
                      className="text-[12px] font-medium mb-1.5 block"
                      style={{ color: "oklch(0.40 0.10 265)" }}
                    >
                      Extra zaterdaguren (u)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={extraSaturday || ""}
                      onChange={(e) =>
                        setExtraSaturday(Number(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="h-9"
                      data-ocid="simulation.saturday.input"
                    />
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "oklch(0.60 0.08 265)" }}
                    >
                      Zaterdag: {settings.saturdayPct}%
                    </p>
                  </div>
                  <div>
                    <Label
                      className="text-[12px] font-medium mb-1.5 block"
                      style={{ color: "oklch(0.40 0.10 265)" }}
                    >
                      Extra zondaguren (u)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={extraSunday || ""}
                      onChange={(e) =>
                        setExtraSunday(Number(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="h-9"
                      data-ocid="simulation.sunday.input"
                    />
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "oklch(0.60 0.08 265)" }}
                    >
                      Zondag: {settings.sundayPct}%
                    </p>
                  </div>
                </div>

                {/* Results */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background:
                      totalBruto > 0
                        ? "oklch(0.93 0.06 265)"
                        : "oklch(0.99 0.01 265)",
                    borderColor:
                      totalBruto > 0
                        ? "oklch(0.75 0.12 265)"
                        : "oklch(0.88 0.03 265)",
                  }}
                >
                  {hasInput ? (
                    <>
                      {/* Per-category breakdown */}
                      <div className="space-y-2 mb-4">
                        {extraOvertime > 0 && (
                          <SimRow
                            label={`Overuren (${extraOvertime}u × 130%)`}
                            bruto={overtimeBruto}
                            premies={overtimeNet.premies}
                            loonheffing={overtimeNet.loonheffing}
                            net={overtimeNet.net}
                          />
                        )}
                        {extraNight > 0 && (
                          <SimRow
                            label={`Nachttoeslag (${extraNight}u × +${settings.nightSupplementPct}%)`}
                            bruto={nightBruto}
                            premies={nightNet.premies}
                            loonheffing={nightNet.loonheffing}
                            net={nightNet.net}
                          />
                        )}
                        {extraSaturday > 0 && (
                          <SimRow
                            label={`Zaterdag (${extraSaturday}u × ${settings.saturdayPct}%)`}
                            bruto={saturdayBruto}
                            premies={saturdayNet.premies}
                            loonheffing={saturdayNet.loonheffing}
                            net={saturdayNet.net}
                          />
                        )}
                        {extraSunday > 0 && (
                          <SimRow
                            label={`Zondag (${extraSunday}u × ${settings.sundayPct}%)`}
                            bruto={sundayBruto}
                            premies={sundayNet.premies}
                            loonheffing={sundayNet.loonheffing}
                            net={sundayNet.net}
                          />
                        )}
                      </div>

                      {/* Total */}
                      <div
                        className="border-t pt-3"
                        style={{ borderColor: "oklch(0.70 0.12 265)" }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[12px] font-semibold"
                            style={{ color: "oklch(0.36 0.14 265)" }}
                          >
                            Totaal extra bruto
                          </span>
                          <span
                            className="text-[14px] font-bold tabular-nums"
                            style={{ color: "oklch(0.30 0.16 265)" }}
                          >
                            {formatCurrency(totalBruto)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[12px]"
                            style={{ color: "oklch(0.50 0.10 265)" }}
                          >
                            −Premies ({totalPremiesPct.toFixed(2)}%)
                          </span>
                          <span
                            className="text-[13px] tabular-nums"
                            style={{ color: "oklch(0.48 0.18 25)" }}
                          >
                            −{formatCurrency(totalNet.premies)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-[12px]"
                            style={{ color: "oklch(0.50 0.10 265)" }}
                          >
                            −Loonheffing bijzonder tarief (
                            {settings.loonheffingPct}%)
                          </span>
                          <span
                            className="text-[13px] tabular-nums"
                            style={{ color: "oklch(0.48 0.18 25)" }}
                          >
                            −{formatCurrency(totalNet.loonheffing)}
                          </span>
                        </div>
                        <div
                          className="border-t pt-2 flex items-center justify-between"
                          style={{ borderColor: "oklch(0.70 0.12 265)" }}
                        >
                          <span
                            className="text-[13px] font-bold"
                            style={{ color: "oklch(0.32 0.14 265)" }}
                          >
                            ≈ Netto extra (range)
                          </span>
                          <span
                            className="text-lg font-bold tabular-nums"
                            style={{ color: "oklch(0.28 0.18 265)" }}
                          >
                            {formatCurrency(totalNet.net * 0.95)} –{" "}
                            {formatCurrency(totalNet.net * 1.05)}
                          </span>
                        </div>
                        <p
                          className="text-[11px] mt-1.5"
                          style={{ color: "oklch(0.50 0.09 265)" }}
                        >
                          Na 40,20% bijzonder tarief + premies. Bijzondere
                          betalingen worden uitbetaald in de{" "}
                          <strong>volgende periode</strong>.
                        </p>
                      </div>
                    </>
                  ) : (
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ color: "oklch(0.55 0.08 265)" }}
                    >
                      Vul het aantal uren in om je potentiële extra netto
                      verdienste te berekenen (incl. premies en bijzonder tarief
                      40,20%).
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function SimRow({
  label,
  bruto,
  premies,
  loonheffing,
  net,
}: {
  label: string;
  bruto: number;
  premies: number;
  loonheffing: number;
  net: number;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2 border"
      style={{
        background: "oklch(0.97 0.02 265)",
        borderColor: "oklch(0.82 0.08 265)",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[12px] font-semibold"
          style={{ color: "oklch(0.36 0.12 265)" }}
        >
          {label}
        </span>
        <span
          className="text-[12px] font-bold tabular-nums"
          style={{ color: "oklch(0.30 0.14 265)" }}
        >
          {formatCurrency(bruto)} bruto
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: "oklch(0.55 0.08 25)" }}>
          −{formatCurrency(premies)} premies, −{formatCurrency(loonheffing)}{" "}
          loonheffing
        </span>
        <span
          className="text-[12px] font-semibold tabular-nums"
          style={{ color: "oklch(0.38 0.16 145)" }}
        >
          ≈ {formatCurrency(net * 0.95)}–{formatCurrency(net * 1.05)} netto
        </span>
      </div>
    </div>
  );
}
