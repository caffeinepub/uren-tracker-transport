import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CheckCircle,
  FileText,
  Link,
  Loader2,
  Moon,
  PiggyBank,
  Save,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
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
    tijdstip: "21:00 \u2013 05:00 uur",
    toeslagPct: "19% (CAO min.) of hoger",
    totaalPct: "119% of 130%",
    opmerking: "Nachttoeslag \u2013 configureerbaar",
  },
  {
    tijdstip: "Overige toeslagen",
    toeslagPct: "30% of 100%",
    totaalPct: "130% of 200%",
    opmerking: "Kan combineren met nacht",
  },
];

const CAO_LOONSCHALEN: LoonTabelRow[] = [
  { schaal: "A1", uurloon: 13.27, periodeloon: 1274.0 },
  { schaal: "A2", uurloon: 13.84, periodeloon: 1328.7 },
  { schaal: "A3", uurloon: 14.43, periodeloon: 1385.4 },
  { schaal: "B1", uurloon: 14.87, periodeloon: 1427.6 },
  { schaal: "B2", uurloon: 15.48, periodeloon: 1486.1 },
  { schaal: "B3", uurloon: 16.11, periodeloon: 1546.6 },
  { schaal: "B4", uurloon: 16.74, periodeloon: 1607.0 },
  { schaal: "C1", uurloon: 16.75, periodeloon: 1608.0 },
  { schaal: "C2", uurloon: 17.42, periodeloon: 1672.4 },
  { schaal: "C3", uurloon: 18.12, periodeloon: 1739.5 },
  { schaal: "C4", uurloon: 18.84, periodeloon: 1808.7 },
  { schaal: "D1", uurloon: 18.16, periodeloon: 1743.4 },
  { schaal: "D2", uurloon: 18.9, periodeloon: 1814.4 },
  { schaal: "D3", uurloon: 19.37, periodeloon: 1859.6 },
  { schaal: "D4", uurloon: 19.84, periodeloon: 1904.9 },
  { schaal: "D5", uurloon: 20.09, periodeloon: 1928.6 },
  { schaal: "D6", uurloon: 20.24, periodeloon: 1943.0 },
  { schaal: "E1", uurloon: 20.25, periodeloon: 1944.0 },
  { schaal: "E2", uurloon: 21.07, periodeloon: 2022.7 },
  { schaal: "E3", uurloon: 21.91, periodeloon: 2103.5 },
  { schaal: "E4", uurloon: 22.78, periodeloon: 2187.0 },
  { schaal: "F1", uurloon: 22.79, periodeloon: 2188.0 },
  { schaal: "F2", uurloon: 23.7, periodeloon: 2275.3 },
  { schaal: "F3", uurloon: 24.64, periodeloon: 2365.5 },
  { schaal: "F4", uurloon: 25.62, periodeloon: 2459.6 },
];
const CAO_TABLE = [
  {
    label: "Vakantiegeld",
    pct: "11,84%",
    desc: "CAO 2026 \u2014 opbouw incl. toeslagen, uitbetaald in mei",
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
    inkomen: "< \u20ac10.000",
    algKorting: "\u20ac 3.068",
    arbeidskorting: "\u20ac 0 \u2013 3.000",
    opmerking: "Volle algemene korting, arbeidskorting loopt op",
  },
  {
    inkomen: "\u20ac 10.000 \u2013 \u20ac24.000",
    algKorting: "\u20ac 3.068 (max)",
    arbeidskorting: "\u20ac 3.000 \u2013 5.599",
    opmerking: "Volle algemene korting + arbeidskorting stijgt naar max",
  },
  {
    inkomen: "\u20ac 24.000 \u2013 \u20ac38.000",
    algKorting: "\u20ac 3.068 (max)",
    arbeidskorting: "\u20ac 5.599 (max)",
    opmerking: "Beide kortingen op maximum \u2014 optimale situatie",
  },
  {
    inkomen: "> \u20ac38.000",
    algKorting: "Daalt af",
    arbeidskorting: "Daalt af",
    opmerking: "Kortingen nemen geleidelijk af bij hoger inkomen",
  },
];

type ParsedCAOValue = {
  key: keyof Settings;
  label: string;
  value: number;
  unit: string;
  checked: boolean;
};

interface LoonTabelRow {
  schaal: string;
  uurloon: number;
  periodeloon?: number;
}

async function loadPdfjsLib(): Promise<any> {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
  const lib = (window as any).pdfjsLib;
  lib.GlobalWorkerOptions.workerSrc =
    "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  return lib;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await loadPdfjsLib();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n");
}

async function extractTextFromPDFUrl(url: string): Promise<string> {
  const pdfjsLib = await loadPdfjsLib();

  // Try direct first, then via CORS proxy
  let pdf: any;
  try {
    pdf = await pdfjsLib.getDocument({ url }).promise;
  } catch {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const resp = await fetch(proxyUrl);
    if (!resp.ok) throw new Error("Kon URL niet ophalen");
    const buffer = await resp.arrayBuffer();
    pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  }

  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }
  return textParts.join("\n");
}

function parseCAOText(text: string): {
  values: ParsedCAOValue[];
  loonTabel: LoonTabelRow[];
} {
  const lower = text.toLowerCase();
  const results: ParsedCAOValue[] = [];

  // Helper: parse number from Dutch notation (comma as decimal)
  const parseDutch = (s: string) =>
    Number.parseFloat(s.replace(/\./g, "").replace(",", "."));

  // Hourly rate: look for patterns like "20,24" near "uurloon" or "per uur" or "\u20ac"
  const hourlyMatch =
    lower.match(/uurloon[^\d]{0,20}(\d{1,3}[,.]\d{2})/i) ||
    lower.match(/(\d{1,3}[,.]\d{2})[^\d]{0,10}per\s+uur/i) ||
    text.match(/\u20ac\s*(\d{1,3}[,.]\d{2})/i);
  if (hourlyMatch) {
    const val = parseDutch(hourlyMatch[1]);
    if (val > 10 && val < 100) {
      results.push({
        key: "hourlyRate",
        label: "Uurloon",
        value: val,
        unit: "\u20ac",
        checked: true,
      });
    }
  }

  // Nachttoeslag: look for percentage near "nacht"
  const nachtMatch =
    lower.match(/nachttoeslag[^\d]{0,30}(\d{1,3}[,.]?\d*)\s*%/i) ||
    lower.match(/nacht[^\d]{0,20}(\d{1,3}[,.]?\d*)\s*%/i) ||
    lower.match(/(19|30)[\s,]*%[^\d]{0,30}nacht/i);
  if (nachtMatch) {
    const val = parseDutch(nachtMatch[1]);
    if (val > 0 && val < 100) {
      results.push({
        key: "nightSupplementPct",
        label: "Nachttoeslag",
        value: val,
        unit: "%",
        checked: true,
      });
    }
  }

  // Vakantiegeld: look for percentage near "vakantiegeld" or "vakantie"
  const vakMatch =
    lower.match(/vakantiegeld[^\d]{0,30}(\d{1,3}[,.]\d+)\s*%/i) ||
    lower.match(/vakantie[^\d]{0,20}(\d{1,3}[,.]\d+)\s*%/i) ||
    lower.match(/(11[,.]\d+)\s*%[^\d]{0,40}vakantie/i);
  if (vakMatch) {
    const val = parseDutch(vakMatch[1]);
    if (val > 5 && val < 30) {
      results.push({
        key: "vacationPayPct",
        label: "Vakantiegeld",
        value: val,
        unit: "%",
        checked: true,
      });
    }
  }

  // Pensioen: look for percentage near "pensioen"
  const pensMatch =
    lower.match(/pensioen[^\d]{0,30}(\d{1,3}[,.]\d+)\s*%/i) ||
    lower.match(/(\d{1,3}[,.]\d+)\s*%[^\d]{0,30}pensioen/i) ||
    lower.match(/(10[,.]\d+)\s*%[^\d]{0,40}pensioen/i);
  if (pensMatch) {
    const val = parseDutch(pensMatch[1]);
    if (val > 1 && val < 30) {
      results.push({
        key: "pensionPct",
        label: "Pensioen",
        value: val,
        unit: "%",
        checked: true,
      });
    }
  }

  // Saturday bonus
  const zatMatch =
    lower.match(/zaterdag[^\d]{0,30}(\d{3})[,.]?\s*%/i) ||
    lower.match(/(150)[\s,]*%[^\d]{0,30}zaterdag/i);
  if (zatMatch) {
    const val = parseDutch(zatMatch[1]);
    if (val >= 100 && val <= 300) {
      results.push({
        key: "saturdayPct",
        label: "Zaterdagtoeslag",
        value: val,
        unit: "%",
        checked: true,
      });
    }
  }

  // Sunday bonus
  const zonMatch =
    lower.match(/zondag[^\d]{0,30}(\d{3})[,.]?\s*%/i) ||
    lower.match(/(200)[\s,]*%[^\d]{0,30}zondag/i);
  if (zonMatch) {
    const val = parseDutch(zonMatch[1]);
    if (val >= 100 && val <= 300) {
      results.push({
        key: "sundayPct",
        label: "Zondagtoeslag",
        value: val,
        unit: "%",
        checked: true,
      });
    }
  }

  // Loon tabel parsing
  const loonTabel: LoonTabelRow[] = [];
  const loonSectionKeywords =
    /loontabel|loonschaal|functieschaal|loongroep|uurloon|periodeloon/i;
  const lines = text.split(/\n/);
  let inLoonSection = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (loonSectionKeywords.test(line)) {
      inLoonSection = true;
    }
    if (!inLoonSection) continue;
    // Try to match scale row: e.g. "D1 20,24" or "D6 21,50 1.891,20"
    const scaleMatch = line.match(
      /(D\d+|[A-F]\d*|\d{1,2})[^\d]+(\d{1,3}[,.]\d{2})/i,
    );
    if (scaleMatch) {
      const schaal = scaleMatch[1].toUpperCase();
      const uurloon = parseDutch(scaleMatch[2]);
      if (uurloon >= 10 && uurloon <= 60) {
        // Check for periodeloon (larger amount in same line)
        const allNums = [
          ...line.matchAll(/(\d{1,3}(?:[.,]\d{3})*[,.]\d{2})/g),
        ].map((m) => parseDutch(m[1]));
        const periodeloon = allNums.find((n) => n >= 1000 && n <= 5000);
        // Avoid duplicates
        if (!loonTabel.find((r) => r.schaal === schaal)) {
          loonTabel.push({ schaal, uurloon, periodeloon });
        }
      }
    }
    // Stop section if we hit a blank sequence far from keywords
    if (
      inLoonSection &&
      i > lines.findIndex((l) => loonSectionKeywords.test(l)) + 40
    ) {
      inLoonSection = false;
    }
  }
  if (loonTabel.length > 0) {
    localStorage.setItem("caoLoonTabel", JSON.stringify(loonTabel));
  }

  return { values: results, loonTabel };
}

function CAOUploadCard({
  onApply,
}: {
  onApply: (values: ParsedCAOValue[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedValues, setParsedValues] = useState<ParsedCAOValue[]>([]);
  const [loonTabel, setLoonTabel] = useState<LoonTabelRow[]>([]);
  const [selectedSchaal, setSelectedSchaal] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const handleUrlLoad = async () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("Voer een geldige URL in die begint met http:// of https://");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setFileName(url);
    setParsedValues([]);
    try {
      const text = await extractTextFromPDFUrl(url);
      const { values, loonTabel: lt } = parseCAOText(text);
      localStorage.setItem("cao_full_text", text);
      setParsedValues(values);
      setLoonTabel(lt);
      const initChecked: Record<string, boolean> = {};
      for (const v of values) {
        initChecked[v.key as string] = true;
      }
      setChecked(initChecked);
      if (values.length === 0 && lt.length === 0) {
        setError(
          "Geen bekende CAO-waarden herkend via deze URL. Controleer of het een CAO PDF-bestand is.",
        );
      }
    } catch (_err) {
      setError(
        "URL kon niet worden ingelezen. Zorg dat de link direct naar een PDF-bestand wijst en publiek toegankelijk is.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Alleen PDF-bestanden zijn toegestaan.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setFileName(file.name);
    setParsedValues([]);

    try {
      const text = await extractTextFromPDF(file);
      const { values, loonTabel: lt } = parseCAOText(text);
      localStorage.setItem("cao_full_text", text);
      setParsedValues(values);
      setLoonTabel(lt);
      const initChecked: Record<string, boolean> = {};
      for (const v of values) {
        initChecked[v.key as string] = true;
      }
      setChecked(initChecked);
      if (values.length === 0 && lt.length === 0) {
        setError(
          "Geen bekende CAO-waarden herkend in dit PDF-bestand. Controleer of het het juiste bestand is.",
        );
      }
    } catch (_err) {
      setError(
        "PDF kon niet worden verwerkt. Controleer of het bestand niet versleuteld of beschadigd is.",
      );
    } finally {
      setIsProcessing(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApply = () => {
    const toApply = parsedValues.filter((v) => checked[v.key as string]);
    onApply(toApply);
    toast.success(
      `${toApply.length} CAO-waarde${toApply.length !== 1 ? "n" : ""} toegepast in instellingen`,
    );
    setParsedValues([]);
    setLoonTabel([]);
    setFileName(null);
  };

  const handleSelectSchaal = (row: LoonTabelRow) => {
    setSelectedSchaal(row.schaal);
    onApply([
      {
        key: "hourlyRate",
        label: `Uurloon (${row.schaal})`,
        value: row.uurloon,
        unit: "€",
        checked: true,
      },
    ]);
    toast.success(
      `Schaal ${row.schaal} geselecteerd: €${row.uurloon.toFixed(2).replace(".", ",")} /uur`,
    );
  };

  return (
    <Card className="border-border shadow-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground text-[15px]">
            CAO Uploaden
          </h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Upload het nieuwe CAO als PDF \u2014 de app herkent automatisch
            percentages en uurlonen
          </p>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {/* URL input */}
        <div className="space-y-2">
          <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5 text-primary" />
            Snelkoppeling (URL) plakken
          </Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://... (directe link naar PDF)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlLoad()}
              disabled={isProcessing}
              className="flex-1 text-[13px]"
              data-ocid="settings.cao.url_input"
            />
            <Button
              type="button"
              onClick={handleUrlLoad}
              disabled={isProcessing || !urlInput.trim()}
              variant="outline"
              className="shrink-0"
              data-ocid="settings.cao.url_button"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Ophalen"
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Of upload een bestand hieronder:
          </p>
        </div>

        {/* Upload area */}
        <button
          type="button"
          className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          data-ocid="settings.cao.dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          {isProcessing ? (
            <>
              <p className="text-[14px] font-medium text-foreground">
                PDF wordt verwerkt...
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Even geduld
              </p>
            </>
          ) : fileName ? (
            <>
              <p className="text-[14px] font-medium text-foreground">
                {fileName}
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Klik om een ander bestand te kiezen
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-medium text-foreground">
                Klik om CAO PDF te uploaden
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Alleen PDF-bestanden (.pdf)
              </p>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}

        {/* Parsed results */}
        {parsedValues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-[13px] font-semibold text-foreground">
                {parsedValues.length} waarde
                {parsedValues.length !== 1 ? "n" : ""} herkend uit PDF
              </p>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              {parsedValues.map((v, i) => (
                <div
                  key={v.key as string}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < parsedValues.length - 1 ? "border-b border-border" : ""
                  } ${checked[v.key as string] ? "bg-background" : "bg-muted/30"}`}
                >
                  <Checkbox
                    id={`cao-check-${v.key as string}`}
                    checked={checked[v.key as string] ?? true}
                    onCheckedChange={(c) =>
                      setChecked((prev) => ({
                        ...prev,
                        [v.key as string]: !!c,
                      }))
                    }
                    data-ocid="settings.cao.checkbox"
                  />
                  <Label
                    htmlFor={`cao-check-${v.key as string}`}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="text-[13px] font-medium text-foreground">
                      {v.label}
                    </span>
                    <span className="ml-2 text-[13px] font-bold text-primary tabular-nums">
                      {v.unit === "\u20ac"
                        ? `\u20ac${v.value.toFixed(2).replace(".", ",")}`
                        : `${v.value}%`}
                    </span>
                  </Label>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[12px] text-amber-800">
                De percentages zijn automatisch herkend uit de PDF. Controleer
                altijd de waarden voor je ze opslaat.
              </p>
            </div>

            <Button
              onClick={handleApply}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-10"
              data-ocid="settings.cao.primary_button"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Toepassen in instellingen
            </Button>
          </motion.div>
        )}

        {/* Loontabel section */}
        {loonTabel.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-blue-500" />
              <p className="text-[13px] font-semibold text-foreground">
                Loontabellen herkend ({loonTabel.length} schalen)
              </p>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[12px] font-semibold py-2 px-3">
                      Schaal
                    </TableHead>
                    <TableHead className="text-[12px] font-semibold py-2 px-3">
                      Uurloon
                    </TableHead>
                    <TableHead className="text-[12px] font-semibold py-2 px-3">
                      Periodeloon
                    </TableHead>
                    <TableHead className="text-[12px] font-semibold py-2 px-3">
                      Actie
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loonTabel.map((row) => (
                    <TableRow
                      key={row.schaal}
                      className={
                        selectedSchaal === row.schaal ? "bg-primary/10" : ""
                      }
                      data-ocid="settings.cao.row"
                    >
                      <TableCell className="py-2 px-3">
                        <span className="font-mono font-bold text-[13px] text-primary">
                          {row.schaal}
                        </span>
                        {selectedSchaal === row.schaal && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary">
                            Actief
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3 tabular-nums text-[13px] font-semibold">
                        €{row.uurloon.toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell className="py-2 px-3 tabular-nums text-[13px] text-muted-foreground">
                        {row.periodeloon
                          ? `€${row.periodeloon.toFixed(2).replace(".", ",")}`
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Button
                          size="sm"
                          variant={
                            selectedSchaal === row.schaal
                              ? "default"
                              : "outline"
                          }
                          className="h-7 text-[12px] px-2"
                          onClick={() => handleSelectSchaal(row)}
                          data-ocid="settings.cao.secondary_button"
                        >
                          Selecteer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

export function SettingsPage({ settings, onSave }: SettingsPageProps) {
  const [form, setForm] = useState<Settings>(settings);
  const [activeLoonSchaal, setActiveLoonSchaal] = useState<string | null>(() =>
    localStorage.getItem("activeLoonSchaal"),
  );

  const set = (key: keyof Settings, value: number | boolean | null) =>
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

  const handleCAOApply = (values: ParsedCAOValue[]) => {
    for (const v of values) {
      set(v.key, v.value);
    }
  };

  const handleSelectBuiltinSchaal = (row: LoonTabelRow) => {
    setActiveLoonSchaal(row.schaal);
    localStorage.setItem("activeLoonSchaal", row.schaal);
    set("hourlyRate", row.uurloon);
    toast.success(
      `Schaal ${row.schaal} geselecteerd: u20ac${row.uurloon.toFixed(2).replace(".", ",")} /uur`,
    );
  };

  const algHeffingskorting = form.algHeffingskorting ?? 3068;
  const arbeidskorting = form.arbeidskorting ?? 5599;
  const weeklyHeffingskorting = (algHeffingskorting + arbeidskorting) / 52;

  const currentPct = form.parttimePct ?? 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Arbeidscontract */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground text-[15px]">
              Arbeidscontract
            </h3>
            <p className="text-muted-foreground text-[13px] mt-0.5">
              Stel je parttime-percentage in (basis: 40 uur fulltime)
            </p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Parttime slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-[13px] font-medium">
                Parttime percentage
              </Label>
              <span className="text-xl font-bold text-primary tabular-nums">
                {currentPct}%
              </span>
            </div>
            <Slider
              min={1}
              max={100}
              step={1}
              value={[currentPct]}
              onValueChange={(value) => {
                const pct = value[0];
                const contract = Math.round(((40 * pct) / 100) * 10) / 10;
                setForm((p) => ({
                  ...p,
                  parttimePct: pct,
                  contractHoursPerWeek: contract,
                  fullTimeHoursPerWeek: 40,
                }));
              }}
              className="w-full"
              data-ocid="settings.parttime.toggle"
            />
            {/* Tick labels */}
            <div className="flex justify-between mt-2 px-0.5">
              {[20, 40, 60, 80, 100].map((tick) => (
                <button
                  key={tick}
                  type="button"
                  onClick={() => {
                    const contract = Math.round(((40 * tick) / 100) * 10) / 10;
                    setForm((p) => ({
                      ...p,
                      parttimePct: tick,
                      contractHoursPerWeek: contract,
                      fullTimeHoursPerWeek: 40,
                    }));
                  }}
                  className={`text-[11px] font-medium transition-colors ${
                    currentPct === tick
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tick}%
                </button>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground mt-2">
              Sleep de slider of klik een percentage om je contractbasis in te
              stellen.
            </p>
          </div>

          {/* Result display */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  Contracturen per week
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  40u \u00d7 {currentPct}% = contractbasis voor
                  overuren-berekening
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {(form.contractHoursPerWeek ?? 24)
                    .toFixed(1)
                    .replace(".", ",")}
                  u
                </p>
                <p className="text-[11px] text-muted-foreground">
                  \u2248{" "}
                  {((form.contractHoursPerWeek ?? 24) / 5)
                    .toFixed(1)
                    .replace(".", ",")}
                  u / dag
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* CAO Uploaden */}
      <CAOUploadCard onApply={handleCAOApply} />

      {/* Loonschaal Selecteren */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground text-[15px]">
              Loonschaal selecteren
            </h3>
            <p className="text-muted-foreground text-[13px] mt-0.5">
              CAO Beroepsgoederenvervoer 2026 u2014 klik op jouw schaal om het
              uurloon in te stellen
            </p>
          </div>
        </div>
        <div className="p-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[12px] font-semibold py-2 px-3">
                  Schaal
                </TableHead>
                <TableHead className="text-[12px] font-semibold py-2 px-3">
                  Uurloon
                </TableHead>
                <TableHead className="text-[12px] font-semibold py-2 px-3">
                  Periodeloon
                </TableHead>
                <TableHead className="text-[12px] font-semibold py-2 px-3">
                  Actie
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAO_LOONSCHALEN.map((row) => (
                <TableRow
                  key={row.schaal}
                  className={
                    activeLoonSchaal === row.schaal ? "bg-primary/10" : ""
                  }
                >
                  <TableCell className="py-2 px-3">
                    <span className="font-mono font-bold text-[13px] text-primary">
                      {row.schaal}
                    </span>
                    {activeLoonSchaal === row.schaal && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary">
                        Actief
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-3 tabular-nums text-[13px] font-semibold">
                    u20ac{row.uurloon.toFixed(2).replace(".", ",")}
                  </TableCell>
                  <TableCell className="py-2 px-3 tabular-nums text-[13px] text-muted-foreground">
                    u20ac
                    {row.periodeloon?.toFixed(2).replace(".", ",") ?? "u2014"}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Button
                      size="sm"
                      variant={
                        activeLoonSchaal === row.schaal ? "default" : "outline"
                      }
                      className="h-7 text-[12px] px-2"
                      onClick={() => handleSelectBuiltinSchaal(row)}
                    >
                      Selecteer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
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
              label="Uurloon (\u20ac)"
              hint="Loonschaal D6 \u2014 standaard \u20ac20,24"
              step="0.01"
              value={form.hourlyRate}
              onChange={(v) => set("hourlyRate", v)}
            />
            <SettingField
              label="Reiskosten per dag (\u20ac)"
              hint="Standaard \u20ac10,12 (32 km woon-werk)"
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
              hint="Standaard 150% \u2014 je verdient 1,5\u00d7 uurloon"
              value={form.saturdayPct}
              onChange={(v) => set("saturdayPct", v)}
            />
            <SettingField
              label="Zondag (%)"
              hint="Standaard 200% \u2014 je verdient 2\u00d7 uurloon"
              value={form.sundayPct}
              onChange={(v) => set("sundayPct", v)}
            />
          </div>
        </div>
      </Card>

      {/* Nachttoeslag */}
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
            Wettelijk vastgestelde inhoudingen op het bruto loon.
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
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <Switch
              id="keuzebudget-enabled"
              checked={form.keuzebudgetEnabled ?? false}
              onCheckedChange={(checked) => set("keuzebudgetEnabled", checked)}
              data-ocid="settings.keuzebudget.switch"
            />
            <div>
              <Label
                htmlFor="keuzebudget-enabled"
                className="text-[13px] font-medium cursor-pointer"
              >
                Keuzebudget opbouw meenemen in berekening
              </Label>
              {form.keuzebudgetEnabled && (
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Keuzebudget 100% wordt meegenomen \u2014 kan belastbaar loon
                  tijdelijk verlagen.
                </p>
              )}
            </div>
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
              Belastingkorting die je nettoloon verhoogt
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
              label="Algemene heffingskorting (\u20ac/jaar)"
              hint="2026 max: \u20ac3.068 \u2014 volle korting bij laag inkomen (< ~\u20ac24k)"
              step="1"
              value={algHeffingskorting}
              onChange={(v) => set("algHeffingskorting", v)}
            />
            <SettingField
              label="Arbeidskorting (\u20ac/jaar)"
              hint="2026 max: \u20ac5.599 \u2014 loopt op met meer werken"
              step="1"
              value={arbeidskorting}
              onChange={(v) => set("arbeidskorting", v)}
            />
          </div>
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
              Jouw situatie (laag inkomen ~\u20ac20k\u201325k)
            </p>
            <div className="flex items-start gap-3 mb-2">
              <span
                className="mt-0.5 text-[16px] leading-none"
                style={{ color: "oklch(0.42 0.18 145)" }}
              >
                \u2713
              </span>
              <p
                className="text-[13px]"
                style={{ color: "oklch(0.32 0.12 145)" }}
              >
                <strong>Algemene heffingskorting:</strong> bij een inkomen onder
                ~\u20ac24.000 ontvang je de volledige \u20ac3.068 per jaar.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 text-[16px] leading-none"
                style={{ color: "oklch(0.42 0.18 145)" }}
              >
                \u2713
              </span>
              <p
                className="text-[13px]"
                style={{ color: "oklch(0.32 0.12 145)" }}
              >
                <strong>Arbeidskorting:</strong> stijgt met je inkomen tot
                \u20ac5.599. Als 60% parttimer ben jij in de optimale zone.
              </p>
            </div>
          </div>
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
            loonheffingstabel periodiek verrekend.
          </p>
        </div>
      </Card>

      {/* Pensioenprognose (Pensioenfonds Vervoer) */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-2"
          style={{ borderBottomColor: "oklch(0.82 0.12 55)" }}
        >
          <PiggyBank
            className="w-4 h-4"
            style={{ color: "oklch(0.55 0.18 145)" }}
          />
          <div>
            <h3 className="font-semibold text-foreground text-[15px]">
              Pensioenprognose (Pensioenfonds Vervoer)
            </h3>
            <p className="text-muted-foreground text-[13px] mt-0.5">
              Instellingen voor de Jaarprognose-berekeningen
            </p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SettingField
              label="Franchise 2026 (\u20ac)"
              hint="Standaard \u20ac17.283 \u2014 drempel Pensioenfonds Vervoer 2026"
              step="1"
              value={form.pensionFranchise ?? 17283}
              onChange={(v) => set("pensionFranchise", v)}
            />
            <SettingField
              label="Opbouwpercentage (%)"
              hint="Pensioenfonds Vervoer 2026: 1,788% van de pensioengrondslag"
              step="0.001"
              value={form.pensionBuildupPct ?? 1.788}
              onChange={(v) => set("pensionBuildupPct", v)}
            />
          </div>
          <div>
            <Label className="text-[13px] font-medium mb-1.5 block">
              Pensioengevend jaarsalaris (handmatig, optioneel)
            </Label>
            <Input
              type="number"
              step="100"
              min="0"
              placeholder="Laat leeg voor automatisch (op basis van ingevoerde weken)"
              value={form.pensiongevingSalaryOverride ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                set(
                  "pensiongevingSalaryOverride",
                  val === "" ? null : Number.parseFloat(val) || 0,
                );
              }}
              className="h-10"
              data-ocid="settings.pension_salary.input"
            />
            <p className="text-[12px] text-muted-foreground mt-1">
              Vul hier je exacte pensioengevend jaarsalaris in als je een
              nauwkeurigere berekening wilt. Laat leeg om de app automatisch te
              laten berekenen op basis van ingevoerde uren.
            </p>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{
              background: "oklch(0.97 0.03 55)",
              borderColor: "oklch(0.87 0.08 55)",
            }}
          >
            <p className="text-[12px]" style={{ color: "oklch(0.42 0.14 55)" }}>
              <strong>Tip:</strong> De exacte Factor A staat op je{" "}
              <strong>Uniform Pensioenoverzicht (UPO)</strong> van Pensioenfonds
              Vervoer, dat jaarlijks in het voorjaar wordt verstuurd. Gebruik
              dat voor de meest nauwkeurige jaarruimteberekening.
            </p>
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
