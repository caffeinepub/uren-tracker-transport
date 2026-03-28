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
import { BookOpen, Moon, Save } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS } from "../hooks/useWeekData";
import type { Settings } from "../types";

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
