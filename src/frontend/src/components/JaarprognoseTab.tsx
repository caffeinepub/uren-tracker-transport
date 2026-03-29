import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ExternalLink,
  Info,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type { Settings } from "../types";
import { formatCurrency } from "../utils/calculations";

interface JaarprognoseTabProps {
  settings: Settings;
  cumulativeIncome: number;
  getAllWeekIncomes: () => Record<string, number>;
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeeksElapsedThisYear(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diffMs = now.getTime() - startOfYear.getTime();
  const diffWeeks = diffMs / (7 * 24 * 60 * 60 * 1000);
  return Math.max(1, Math.round(diffWeeks));
}

function calcPensionScenario(
  annualIncome: number,
  franchise: number,
  buildupPct: number,
) {
  const grondslag = Math.max(0, annualIncome - franchise);
  const factorA = (buildupPct / 100) * grondslag;
  return { grondslag, factorA, pensioengevend: annualIncome };
}

function calcJaarruimte(annualIncome: number, factorA: number): number {
  // Rough formula: 30% × premiegrondslag − 6.27 × Factor A
  return 0.3 * annualIncome - 6.27 * factorA;
}

const SCENARIO_CONFIGS = [
  { label: "Huidige uren", deltaHours: 0, primary: true },
  { label: "+5 uur/week", deltaHours: 5, primary: false },
  { label: "−5 uur/week", deltaHours: -5, primary: false },
];

export function JaarprognoseTab({
  settings,
  cumulativeIncome,
  getAllWeekIncomes,
}: JaarprognoseTabProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeekNum = getISOWeekNumber(now);
  const weeksElapsed = getWeeksElapsedThisYear();
  const totalWeeksInYear = 52;
  const remainingWeeks = Math.max(0, totalWeeksInYear - weeksElapsed);

  const weekIncomes = getAllWeekIncomes();
  // Count filled weeks for this year
  const filledWeeks = Object.keys(weekIncomes).filter((k) =>
    k.startsWith(`${currentYear}-W`),
  ).length;
  const effectiveWeeks = Math.max(1, filledWeeks || weeksElapsed);
  const avgWeekly = cumulativeIncome / effectiveWeeks;

  const projectedRemaining = avgWeekly * remainingWeeks;
  const basePensionSalary =
    settings.pensiongevingSalaryOverride != null
      ? settings.pensiongevingSalaryOverride
      : cumulativeIncome + projectedRemaining;

  const franchise = settings.pensionFranchise ?? 17283;
  const buildupPct = settings.pensionBuildupPct ?? 1.788;

  // Scenarios
  const scenarios = SCENARIO_CONFIGS.map((cfg) => {
    const deltaAnnual = cfg.deltaHours * settings.hourlyRate * totalWeeksInYear;
    const scenarioIncome = Math.max(0, basePensionSalary + deltaAnnual);
    const pension = calcPensionScenario(scenarioIncome, franchise, buildupPct);
    const jaarruimte = calcJaarruimte(scenarioIncome, pension.factorA);
    return { ...cfg, ...pension, scenarioIncome, jaarruimte };
  });

  const current = scenarios[0];

  // WKR indicatie
  const estimatedTravelWkr = weeksElapsed * settings.travelAllowancePerDay * 5;

  // Warnings
  const TAX_BRACKET2 = 38883;
  const HEFFINGSKORTING_PHASE_OUT = 29737;

  const barMax = Math.max(...scenarios.map((s) => s.factorA), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Section A: Geschat Jaarinkomen */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <CardHeader
          className="pb-3 border-b border-border"
          style={{ background: "oklch(0.96 0.025 240)" }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp
              className="w-5 h-5"
              style={{ color: "oklch(0.40 0.14 240)" }}
            />
            <CardTitle
              className="text-[15px]"
              style={{ color: "oklch(0.28 0.08 240)" }}
            >
              Geschat Jaarinkomen {currentYear}
            </CardTitle>
            <Badge
              className="ml-auto text-[11px]"
              style={{
                background: "oklch(0.86 0.10 240)",
                color: "oklch(0.28 0.08 240)",
              }}
            >
              Week {currentWeekNum}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox
              label="Verdiend tot nu toe"
              value={formatCurrency(cumulativeIncome)}
              sub={`${effectiveWeeks} weken ingevoerd`}
            />
            <StatBox
              label="Gemiddeld per week"
              value={formatCurrency(avgWeekly)}
              sub="op basis van ingevoerde weken"
            />
            <StatBox
              label="Prognose resterende weken"
              value={formatCurrency(projectedRemaining)}
              sub={`${remainingWeeks} weken resterend`}
            />
            <StatBox
              label="Geschat bruto jaarinkomen"
              value={formatCurrency(basePensionSalary)}
              highlight
              sub={
                settings.pensiongevingSalaryOverride != null
                  ? "handmatig ingesteld"
                  : "prognose op basis van huidig gemiddelde"
              }
            />
          </div>
          {settings.pensiongevingSalaryOverride != null && (
            <div
              className="mt-4 rounded-lg px-3 py-2 text-[12px]"
              style={{
                background: "oklch(0.97 0.03 55)",
                color: "oklch(0.42 0.14 55)",
                border: "1px solid oklch(0.87 0.10 55)",
              }}
            >
              <Info className="inline w-3.5 h-3.5 mr-1" />
              Pensioengevend salaris is handmatig ingesteld op{" "}
              <strong>
                {formatCurrency(settings.pensiongevingSalaryOverride)}
              </strong>
              . Wijzig dit in Instellingen → Pensioenprognose.
            </div>
          )}
          <p className="mt-3 text-[12px] text-muted-foreground">
            Pensioengevend salaris = bruto jaarinkomen inclusief toeslagen en
            overuren (conform Pensioenfonds Vervoer).
          </p>
        </CardContent>
      </Card>

      {/* Section B: Pensioenopbouw */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <PiggyBank
              className="w-5 h-5"
              style={{ color: "oklch(0.55 0.18 145)" }}
            />
            <CardTitle className="text-[15px]">
              Pensioenopbouw — Pensioenfonds Vervoer 2026
            </CardTitle>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Opbouwpercentage: <strong>{buildupPct}%</strong> · Franchise:{" "}
            <strong>{formatCurrency(franchise)}</strong>
          </p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {scenarios.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border p-4 transition-all"
                style={{
                  background: s.primary
                    ? "oklch(0.97 0.04 55)"
                    : "oklch(0.97 0.015 240)",
                  borderColor: s.primary
                    ? "oklch(0.82 0.12 55)"
                    : "oklch(0.88 0.04 240)",
                }}
                data-ocid={`jaarprognose.scenario.${s.primary ? "1" : s.deltaHours > 0 ? "2" : "3"}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[12px] font-bold uppercase tracking-wide"
                    style={{
                      color: s.primary
                        ? "oklch(0.50 0.18 55)"
                        : "oklch(0.45 0.08 240)",
                    }}
                  >
                    {s.label}
                  </span>
                  {s.primary && (
                    <Badge
                      className="text-[10px] py-0"
                      style={{
                        background: "oklch(0.72 0.165 55)",
                        color: "white",
                      }}
                    >
                      huidig
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <Row
                    label="Pensioengevend salaris"
                    value={formatCurrency(s.pensioengevend)}
                  />
                  <Row
                    label="Pensioengrondslag"
                    value={formatCurrency(s.grondslag)}
                    sub={`(min. franchise ${formatCurrency(franchise)})`}
                  />
                  <div
                    className="pt-2 mt-2 border-t"
                    style={{
                      borderColor: s.primary
                        ? "oklch(0.82 0.12 55)"
                        : "oklch(0.88 0.04 240)",
                    }}
                  >
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                      Factor A (pensioenaangroei)
                    </p>
                    <p
                      className="text-[22px] font-bold tabular-nums"
                      style={{
                        color: s.primary
                          ? "oklch(0.50 0.20 55)"
                          : "oklch(0.35 0.08 240)",
                      }}
                    >
                      {formatCurrency(s.factorA)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {buildupPct}% × {formatCurrency(s.grondslag)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simple SVG bar chart */}
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Factor A vergelijking
            </p>
            <div className="space-y-3">
              {scenarios.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-[12px] text-muted-foreground w-24 shrink-0">
                    {s.label}
                  </span>
                  <div className="flex-1 h-6 bg-border/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.max(2, (s.factorA / barMax) * 100)}%`,
                      }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{
                        background: s.primary
                          ? "oklch(0.72 0.165 55)"
                          : s.deltaHours > 0
                            ? "oklch(0.55 0.18 145)"
                            : "oklch(0.60 0.12 240)",
                      }}
                    />
                  </div>
                  <span
                    className="text-[13px] font-bold tabular-nums w-20 text-right shrink-0"
                    style={{
                      color: s.primary
                        ? "oklch(0.50 0.20 55)"
                        : "oklch(0.45 0.08 240)",
                    }}
                  >
                    {formatCurrency(s.factorA)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Hogere overuren → hoger pensioengevend salaris → hogere Factor A →
              minder jaarruimte voor eigen sparen.
            </p>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            De exacte Factor A staat op je{" "}
            <strong>Uniform Pensioenoverzicht (UPO)</strong> van Pensioenfonds
            Vervoer, dat jaarlijks in het voorjaar wordt verstuurd. Dit zijn
            schattingen op basis van je ingevoerde uren.
          </p>
        </CardContent>
      </Card>

      {/* Section C: Jaarruimte */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-[15px]">
            Jaarruimte voor extra pensioensparen
          </CardTitle>
          <p className="text-[12px] text-muted-foreground mt-1">
            Ruimte om belastingvriendelijk extra pensioen op te bouwen (bijv.
            via lijfrente)
          </p>
        </CardHeader>
        <CardContent className="p-5">
          <div
            className="rounded-xl border p-4 mb-4"
            style={{
              background:
                current.jaarruimte > 0
                  ? "oklch(0.97 0.04 145)"
                  : "oklch(0.97 0.04 25)",
              borderColor:
                current.jaarruimte > 0
                  ? "oklch(0.84 0.12 145)"
                  : "oklch(0.84 0.12 25)",
            }}
          >
            {current.jaarruimte > 0 ? (
              <>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide mb-1"
                  style={{ color: "oklch(0.42 0.16 145)" }}
                >
                  Geschatte jaarruimte
                </p>
                <p
                  className="text-[28px] font-bold tabular-nums"
                  style={{ color: "oklch(0.40 0.18 145)" }}
                >
                  {formatCurrency(current.jaarruimte)}
                </p>
                <p
                  className="text-[12px] mt-1"
                  style={{ color: "oklch(0.42 0.12 145)" }}
                >
                  30% × {formatCurrency(current.scenarioIncome)} − 6,27 ×{" "}
                  {formatCurrency(current.factorA)}
                </p>
              </>
            ) : (
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "oklch(0.55 0.18 25)" }}
                />
                <p
                  className="text-[13px]"
                  style={{ color: "oklch(0.42 0.16 25)" }}
                >
                  <strong>Jaarruimte is nihil</strong> — je pensioenopbouw via
                  werkgever dekt het maximum al.
                </p>
              </div>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground mb-3">
            Dit is een ruwe schatting. Gebruik de officiële rekenhulp van de
            Belastingdienst voor de exacte berekening.
          </p>
          <a
            href="https://www.belastingdienst.nl/wps/wcm/connect/nl/jaarruimte-en-reserveringsruimte/jaarruimte-en-reserveringsruimte"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
            style={{ color: "oklch(0.45 0.16 240)" }}
            data-ocid="jaarprognose.jaarruimte.link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Belastingdienst rekenhulp jaarruimte
          </a>
        </CardContent>
      </Card>

      {/* Section D: WKR */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-[15px]">
            Onbelaste vergoedingen — WKR indicatie
          </CardTitle>
          <p className="text-[12px] text-muted-foreground mt-1">
            Werkkostenregeling — informatief overzicht
          </p>
        </CardHeader>
        <CardContent className="p-5">
          <div
            className="rounded-xl border p-4 mb-4 flex items-center justify-between"
            style={{
              background: "oklch(0.97 0.025 240)",
              borderColor: "oklch(0.86 0.06 240)",
            }}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
                Geschatte onbelaste reiskosten dit jaar
              </p>
              <p
                className="text-[22px] font-bold tabular-nums"
                style={{ color: "oklch(0.35 0.10 240)" }}
              >
                {formatCurrency(estimatedTravelWkr)}
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {weeksElapsed} weken ×{" "}
                {settings.travelAllowancePerDay.toFixed(2)} €/dag × 5 dagen
                (schatting)
              </p>
            </div>
            <Info
              className="w-8 h-8 shrink-0"
              style={{ color: "oklch(0.70 0.08 240)" }}
            />
          </div>
          <p className="text-[12px] text-muted-foreground">
            Deze vergoedingen tellen mee voor de vrije ruimte van de
            Werkkostenregeling (WKR) van jouw werkgever (Simon Loos). In 2026
            geldt 2% over de eerste €400.000 fiscale loonsom + 1,18% over het
            meerdere. Dit is ter informatie — de werkgever beheert de WKR.
          </p>
        </CardContent>
      </Card>

      {/* Section E: Waarschuwingen */}
      {basePensionSalary > HEFFINGSKORTING_PHASE_OUT && (
        <div className="space-y-3">
          {basePensionSalary > TAX_BRACKET2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border px-4 py-3.5 flex items-start gap-3"
              style={{
                background: "oklch(0.97 0.06 55)",
                borderColor: "oklch(0.84 0.14 55)",
              }}
              data-ocid="jaarprognose.bracket2.error_state"
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "oklch(0.52 0.20 55)" }}
              />
              <p
                className="text-[13px]"
                style={{ color: "oklch(0.40 0.16 55)" }}
              >
                <strong>Let op:</strong> Geschat jaarinkomen{" "}
                <strong>{formatCurrency(basePensionSalary)}</strong> nadert de
                grens van belastingschijf 2 (€38.883). Overuren worden dan
                belast met <strong>49,5%</strong>.
              </p>
            </motion.div>
          )}
          {basePensionSalary > HEFFINGSKORTING_PHASE_OUT &&
            basePensionSalary <= TAX_BRACKET2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border px-4 py-3.5 flex items-start gap-3"
                style={{
                  background: "oklch(0.97 0.03 240)",
                  borderColor: "oklch(0.86 0.08 240)",
                }}
                data-ocid="jaarprognose.heffingskorting.error_state"
              >
                <Info
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "oklch(0.50 0.14 240)" }}
                />
                <p
                  className="text-[13px]"
                  style={{ color: "oklch(0.38 0.10 240)" }}
                >
                  Jouw algemene heffingskorting daalt geleidelijk boven €29.737.
                  Dit is al verwerkt in de nettoschatting.
                </p>
              </motion.div>
            )}
        </div>
      )}
    </motion.div>
  );
}

function StatBox({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: highlight ? "oklch(0.97 0.04 55)" : "oklch(0.97 0.015 240)",
        borderColor: highlight ? "oklch(0.82 0.12 55)" : "oklch(0.88 0.04 240)",
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className="text-[20px] font-bold tabular-nums"
        style={{
          color: highlight ? "oklch(0.50 0.20 55)" : "oklch(0.35 0.08 240)",
        }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <span className="text-[13px] font-semibold tabular-nums">{value}</span>
      </div>
      {sub && (
        <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
          {sub}
        </p>
      )}
    </div>
  );
}
