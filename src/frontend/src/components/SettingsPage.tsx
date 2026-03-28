import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeCheck, BookOpen, Moon, Save } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS } from "../hooks/useWeekData";
import type { Settings } from "../types";
import { formatCurrency } from "../utils/calculations";

interface SettingsPageProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

const NACHT_TABLE = [
  {
    tijdstip: "Tot 21:00 uur",
    toeslagPct: "0%",
    totaalPct: "100%",
    opmerking: "Normaal uurloon",
  },
  {
    tijdstip: "21:00 – 05:00 uur",
    toeslagPct: "19% (CAO min.) of hoger",
    totaalPct: "119% of 130%",
    opmerking: "Nachttoeslag – configureerbaar",
  },
  {
    tijdstip: "Overige toeslagen",
    toeslagPct: "30% of 100%",
    totaalPct: "130% of 200%",
    opmerking: "Kan combineren met nacht",
  },
];

const CAO_TABLE = [
  {
    label: "Vakantiegeld",
    pct: "11,84%",
    desc: "CAO 2026 — opbouw incl. toeslagen, uitbetaald in mei",
  },
  {
    label: "Pensioen",
    pct: "10,16%",
    desc: "Pensioenfonds Vervoer, werknemersdeel",
  },
  {
    label: "WIA-Hiaat",
    pct: "0,90%",
    desc: "Aanvullende arbeidsongeschiktheidsverzekering",
  },
  {
    label: "SOOB",
    pct: "0,245%",
    desc: "Sectorfonds voor scholing en ontwikkeling",
  },
  {
    label: "Whk premie",
    pct: "0,52%",
    desc: "Werkhervattingskas (WGA + ZW), tarief Simon Loos",
  },
  {
    label: "Loonheffing",
    pct: "40,20%",
    desc: "Bijzonder tarief voor correcties en eenmalige uitbetalingen",
  },
  {
    label: "Keuzebudget",
    pct: "100%",
    desc: "Persoonlijk keuzebudget (IKB), vrij opneembaar",
  },
];

const HEFFINGSKORTING_TABLE = [
  {
    inkomen: "< €10.000",
    algKorting: "€ 3.068",
    arbeidskorting: "€ 0 – 3.000",
    opmerking: "Volle algemene korting, arbeidskorting loopt op",
  },
  {
    inkomen: "€ 10.000 – €24.000",
    algKorting: "€ 3.068 (max)",
    arbeidskorting: "€ 3.000 – 5.599",
    opmerking: "Volle algemene korting + arbeidskorting stijgt naar max",
  },
  {
    inkomen: "€ 24.000 – €38.000",
    algKorting: "€ 3.068 (max)",
    arbeidskorting: "€ 5.599 (max)",
    opmerking: "Beide kortingen op maximum — optimale situatie",
  },
  {
    inkomen: "> €38.000",
    algKorting: "Daalt af",
    arbeidskorting: "Daalt af",
    opmerking: "Kortingen nemen geleidelijk af bij hoger inkomen",
  },
];

export function SettingsPage({ settings, onSave }: SettingsPageProps) {
  const [form, setForm] = useState<Settings>(settings);

  const set = (key: keyof Settings, value: number) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = () => {
    onSave(form);
    toast.success("Instellingen opgeslagen");
  };

  const handleReset = () => {
    setForm(DEFAULT_SETTINGS);
    onSave(DEFAULT_SETTINGS);
    toast.success("Standaardwaarden hersteld");
  };

  const algHeffingskorting = form.algHeffingskorting ?? 3068;
  const arbeidskorting = form.arbeidskorting ?? 5599;
  const weeklyHeffingskorting = (algHeffingskorting + arbeidskorting) / 52;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Loon & reiskosten */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-[15px]">
            Loon & reiskosten
          </h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Jouw uurloon en dagvergoeding
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SettingField
              label="Uurloon (€)"
              hint="Loonschaal D6 — standaard €20,24"
              step="0.01"
              value={form.hourlyRate}
              onChange={(v) => set("hourlyRate", v)}
            />
            <SettingField
              label="Reiskosten per dag (€)"
              hint="Standaard €10,12 (32 km woon-werk)"
              step="0.01"
              value={form.travelAllowancePerDay}
              onChange={(v) => set("travelAllowancePerDay", v)}
            />
          </div>
        </div>
      </Card>

      {/* Dagtoeslagen */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-[15px]">
            Dagtoeslagen (%)
          </h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Totaal uitbetaald percentage op deze dagen (100% = normaal uurloon)
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SettingField
              label="Zaterdag (%)"
              hint="Standaard 150% — je verdient 1,5× uurloon"
              value={form.saturdayPct}
              onChange={(v) => set("saturdayPct", v)}
            />
            <SettingField
              label="Zondag (%)"
              hint="Standaard 200% — je verdient 2× uurloon"
              value={form.sundayPct}
              onChange={(v) => set("sundayPct", v)}
            />
          </div>
        </div>
      </Card>

      {/* Overwerk doordeweeks */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-[15px]">
            Overwerk doordeweeks (%)
          </h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Na 8 uur werken op maandag t/m vrijdag
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SettingField
              label="Eerste 2 overuren (%)"
              hint="Standaard 125%"
              value={form.overtimeWeekday1Pct}
              onChange={(v) => set("overtimeWeekday1Pct", v)}
            />
            <SettingField
              label="Daarna (%)"
              hint="Standaard 150%"
              value={form.overtimeWeekday2Pct}
              onChange={(v) => set("overtimeWeekday2Pct", v)}
            />
          </div>
        </div>
      </Card>

      {/* Nachttoeslag – uitgebreid configureerbaar */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Moon className="w-4 h-4 text-blue-400" />
          <div>
            <h3 className="font-semibold text-foreground text-[15px]">
              Nachttoeslag (CAO 2026)
            </h3>
            <p className="text-muted-foreground text-[13px] mt-0.5">
              Uren na de ingestelde begintijd krijgen automatisch deze toeslag
            </p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <SettingField
              label="Nachttoeslag extra (+%)"
              hint="CAO minimum: 19%. Bij Simon Loos bijv. 30%"
              step="0.5"
              value={form.nightSupplementPct}
              onChange={(v) => set("nightSupplementPct", v)}
            />
            <SettingField
              label="Nacht begint (uur)"
              hint="Standaard 21 (= 21:00 uur)"
              step="1"
              value={form.nightStartHour}
              onChange={(v) => set("nightStartHour", v)}
            />
            <SettingField
              label="Nacht eindigt (uur)"
              hint="Standaard 5 (= 05:00 uur)"
              step="1"
              value={form.nightEndHour}
              onChange={(v) => set("nightEndHour", v)}
            />
          </div>

          {/* Nachttoeslag tabel */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-[12px] font-semibold">
                    Tijdstip
                  </TableHead>
                  <TableHead className="text-[12px] font-semibold">
                    Toeslag (extra %)
                  </TableHead>
                  <TableHead className="text-[12px] font-semibold">
                    Totaal % uurloon
                  </TableHead>
                  <TableHead className="text-[12px] font-semibold">
                    Opmerking
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {NACHT_TABLE.map((row, i) => (
                  <TableRow
                    key={row.tijdstip}
                    className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                  >
                    <TableCell className="text-[13px] font-semibold text-foreground py-2.5">
                      {row.tijdstip}
                    </TableCell>
                    <TableCell className="text-[13px] font-mono tabular-nums text-blue-500 font-semibold py-2.5">
                      {row.toeslagPct}
                    </TableCell>
                    <TableCell className="text-[13px] font-mono tabular-nums font-semibold py-2.5">
                      {row.totaalPct}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground py-2.5">
                      {row.opmerking}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Bron: CAO Beroepsgoederenvervoer 2026, art. toeslagenmatrix.
            Werkgevers mogen hogere percentages hanteren.
          </p>
        </div>
      </Card>

      {/* Avondtoeslag (optioneel) */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-[15px]">
            Avondtoeslag (optioneel)
          </h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Extra % voor uren tussen 18:00 en de nachttoeslag-begintijd. Stel op
            0 als niet van toepassing.
          </p>
        </div>
        <div className="p-5">
          <div className="max-w-xs">
            <SettingField
              label="Avondtoeslag 18:00 – nacht (+%)"
              hint="Standaard 0% (niet verplicht CAO)"
              step="0.5"
              value={form.eveningSupplementPct}
              onChange={(v) => set("eveningSupplementPct", v)}
            />
          </div>
        </div>
      </Card>

      {/* Weekbonus */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-[15px]">
            Weekbonus boven 24 uur (+%)
          </h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Extra toeslag op overuren als weektotaal boven 24 uur uitkomt
          </p>
        </div>
        <div className="p-5">
          <SettingField
            label="Bonus op overuren (+%)"
            hint="Standaard +30%"
            value={form.weeklyOvertimeBonusPct}
            onChange={(v) => set("weeklyOvertimeBonusPct", v)}
          />
        </div>
      </Card>

      {/* CAO Inhoudingen */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-[15px]">
            CAO Inhoudingen (werknemersaandeel)
          </h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Wettelijk vastgestelde inhoudingen op het bruto loon. Pas aan als
            jouw strook afwijkt.
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <SettingField
              label="Vakantiegeld periodiek (%)"
              hint="CAO 2026: 11,84% (incl. toeslagen)"
              step="0.01"
              value={form.vacationPayPct}
              onChange={(v) => set("vacationPayPct", v)}
            />
            <SettingField
              label="Pensioen Pensioenfonds Vervoer (%)"
              hint="Werknemersdeel: 10,16%"
              step="0.01"
              value={form.pensionPct}
              onChange={(v) => set("pensionPct", v)}
            />
            <SettingField
              label="WIA-Hiaat verzekering (%)"
              hint="Sectorverzekering: 0,90%"
              step="0.01"
              value={form.wiaHiaatPct}
              onChange={(v) => set("wiaHiaatPct", v)}
            />
            <SettingField
              label="SOOB bijdrage (%)"
              hint="Opleidingsfonds CAO: 0,245%"
              step="0.001"
              value={form.soobPct}
              onChange={(v) => set("soobPct", v)}
            />
            <SettingField
              label="Whk premie gediff. (%)"
              hint="Werkhervattingskas: 0,52%"
              step="0.01"
              value={form.whkPct}
              onChange={(v) => set("whkPct", v)}
            />
            <SettingField
              label="Loonheffing bijzonder tarief (%)"
              hint="Schattingstabel 2026: 40,20%"
              step="0.01"
              value={form.loonheffingPct}
              onChange={(v) => set("loonheffingPct", v)}
            />
          </div>
        </div>
      </Card>

      {/* Keuzebudget */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-[15px]">
            Keuzebudget
          </h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Persoonlijk keuzebudget (voorheen IKB)
          </p>
        </div>
        <div className="p-5">
          <div className="max-w-xs">
            <SettingField
              label="Keuzebudget opbouw (%)"
              hint="100% = volledig gestort in keuzebudget"
              step="1"
              value={form.keuzebudgetPct}
              onChange={(v) => set("keuzebudgetPct", v)}
            />
          </div>
        </div>
      </Card>

      {/* Heffingskorting 2026 */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-2"
          style={{ borderBottomColor: "oklch(0.82 0.12 145)" }}
        >
          <BadgeCheck
            className="w-4 h-4"
            style={{ color: "oklch(0.42 0.16 145)" }}
          />
          <div>
            <h3 className="font-semibold text-foreground text-[15px]">
              Heffingskorting 2026
            </h3>
            <p className="text-muted-foreground text-[13px] mt-0.5">
              Belastingkorting die je nettoloon verhoogt — voordeel bij laag
              inkomen
            </p>
          </div>
          <div
            className="ml-auto text-right"
            style={{ color: "oklch(0.40 0.16 145)" }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide">
              Wekelijks voordeel
            </p>
            <p className="text-[17px] font-bold tabular-nums">
              +{formatCurrency(weeklyHeffingskorting)}
            </p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SettingField
              label="Algemene heffingskorting (€/jaar)"
              hint="2026 max: €3.068 — volle korting bij laag inkomen (< ~€24k)"
              step="1"
              value={algHeffingskorting}
              onChange={(v) => set("algHeffingskorting", v)}
            />
            <SettingField
              label="Arbeidskorting (€/jaar)"
              hint="2026 max: €5.599 — loopt op met meer werken, max rond €24k inkomen"
              step="1"
              value={arbeidskorting}
              onChange={(v) => set("arbeidskorting", v)}
            />
          </div>

          {/* Inkomensgrafiek uitleg */}
          <div
            className="rounded-xl border p-4"
            style={{
              background: "oklch(0.97 0.04 145)",
              borderColor: "oklch(0.86 0.10 145)",
            }}
          >
            <p
              className="text-[12px] font-bold uppercase tracking-wide mb-3"
              style={{ color: "oklch(0.42 0.14 145)" }}
            >
              Jouw situatie (laag inkomen ~€20k–25k)
            </p>
            <div className="flex items-start gap-3 mb-2">
              <span
                className="mt-0.5 text-[16px] leading-none"
                style={{ color: "oklch(0.42 0.18 145)" }}
              >
                ✓
              </span>
              <p
                className="text-[13px]"
                style={{ color: "oklch(0.32 0.12 145)" }}
              >
                <strong>Algemene heffingskorting:</strong> bij een inkomen onder
                ~€24.000 ontvang je de volledige €3.068 per jaar. Dit is een
                vaste korting op de loonheffing die iedere werkende krijgt.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 text-[16px] leading-none"
                style={{ color: "oklch(0.42 0.18 145)" }}
              >
                ✓
              </span>
              <p
                className="text-[13px]"
                style={{ color: "oklch(0.32 0.12 145)" }}
              >
                <strong>Arbeidskorting:</strong> stijgt met je inkomen tot een
                maximum van €5.599 bij ~€24.000. Daarna daalt hij geleidelijk
                boven ~€38.000. Als 60% parttimer ben jij precies in de optimale
                zone.
              </p>
            </div>
          </div>

          {/* Inkomenstabel */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-[12px] font-semibold">
                    Inkomen/jaar
                  </TableHead>
                  <TableHead className="text-[12px] font-semibold">
                    Alg. heffingskorting
                  </TableHead>
                  <TableHead className="text-[12px] font-semibold">
                    Arbeidskorting
                  </TableHead>
                  <TableHead className="text-[12px] font-semibold">
                    Situatie
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HEFFINGSKORTING_TABLE.map((row, i) => (
                  <TableRow
                    key={row.inkomen}
                    className={
                      i === 1 || i === 2
                        ? "bg-green-50"
                        : i % 2 === 0
                          ? "bg-background"
                          : "bg-muted/20"
                    }
                  >
                    <TableCell className="text-[13px] font-semibold text-foreground py-2.5">
                      {row.inkomen}
                    </TableCell>
                    <TableCell
                      className="text-[13px] font-mono tabular-nums font-semibold py-2.5"
                      style={{ color: "oklch(0.40 0.16 145)" }}
                    >
                      {row.algKorting}
                    </TableCell>
                    <TableCell
                      className="text-[13px] font-mono tabular-nums font-semibold py-2.5"
                      style={{ color: "oklch(0.40 0.16 145)" }}
                    >
                      {row.arbeidskorting}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground py-2.5">
                      {row.opmerking}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Bron: Belastingdienst 2026. De kortingen worden via de
            loonheffingstabel maandelijks/periodiek verrekend door de werkgever.
            Bij parttime en laag inkomen profiteer je maximaal.
          </p>
        </div>
      </Card>

      {/* Actieknoppen */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          className="bg-orange hover:bg-orange-light text-white font-semibold h-10 px-5"
          data-ocid="settings.submit_button"
        >
          <Save className="w-4 h-4 mr-2" />
          Opslaan
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="h-10 px-5 text-[13px]"
        >
          Standaardwaarden herstellen
        </Button>
      </div>

      {/* CAO Referentietabel */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-[15px]">
            Wat betekenen deze percentages?
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[12px] font-semibold w-[120px]">
                  Inhouding
                </TableHead>
                <TableHead className="text-[12px] font-semibold w-[80px]">
                  %
                </TableHead>
                <TableHead className="text-[12px] font-semibold">
                  Omschrijving
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAO_TABLE.map((row, i) => (
                <TableRow
                  key={row.label}
                  className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  <TableCell className="text-[13px] font-semibold text-foreground py-2.5">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-[13px] font-mono tabular-nums text-orange font-semibold py-2.5">
                    {row.pct}
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground py-2.5">
                    {row.desc}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/20">
          <p className="text-[11px] text-muted-foreground">
            Bron: CAO Beroepsgoederenvervoer 2026 & Pensioenfonds Vervoer
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

function SettingField({
  label,
  hint,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <div>
      <Label className="text-[13px] font-medium mb-1.5 block">{label}</Label>
      <Input
        type="number"
        step={step}
        min="0"
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
        className="h-10"
        data-ocid="settings.input"
      />
      <p className="text-[12px] text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}
