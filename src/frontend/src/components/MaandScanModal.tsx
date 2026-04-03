import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileImage,
  FileText,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { DayEntry, Settings } from "../types";
import {
  extractTextFromPDF,
  parseMonthlyScheduleText,
} from "../utils/parseSchedule";
import type { ParsedMonthlyDay } from "../utils/parseSchedule";

const DAY_NL = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

function getDayNameFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  return DAY_NL[d.getDay()];
}

function formatDateNL(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface MaandScanModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onApply: (entries: Record<string, DayEntry>) => void;
}

interface FileStatus {
  file: File;
  status: "pending" | "scanning" | "done" | "error";
  progress: number;
  text: string;
  isPdf: boolean;
  error?: string;
}

async function runOCR(
  url: string,
  onProgress: (p: number) => void,
): Promise<string> {
  // @ts-ignore
  const T: any = await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js"
  );
  const Tesseract = T.default ?? T;
  const result = await Tesseract.recognize(url, "nld", {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  return result.data.text as string;
}

export function MaandScanModal({
  open,
  onClose,
  settings,
  onApply,
}: MaandScanModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [parsedDays, setParsedDays] = useState<ParsedMonthlyDay[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanYear, setScanYear] = useState<number>(new Date().getFullYear());

  const travelPerDay = settings.travelAllowancePerDay ?? 10.12;

  const reset = useCallback(() => {
    setFileStatuses([]);
    setParsedDays([]);
    setIsProcessing(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const updateFileStatus = useCallback(
    (index: number, update: Partial<FileStatus>) => {
      setFileStatuses((prev) =>
        prev.map((fs, i) => (i === index ? { ...fs, ...update } : fs)),
      );
    },
    [],
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const newStatuses: FileStatus[] = files.map((file) => ({
        file,
        status: "pending",
        progress: 0,
        text: "",
        isPdf: file.type === "application/pdf",
      }));

      setFileStatuses((prev) => [...prev, ...newStatuses]);
      setIsProcessing(true);

      const startIndex = fileStatuses.length;
      const allTexts: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const fileIndex = startIndex + i;
        const file = files[i];
        const isPdf = file.type === "application/pdf";

        updateFileStatus(fileIndex, { status: "scanning" });

        try {
          let text: string;
          if (isPdf) {
            // PDF: direct text extraction (much faster & more accurate than OCR)
            updateFileStatus(fileIndex, { progress: 30 });
            text = await extractTextFromPDF(file);
            updateFileStatus(fileIndex, {
              status: "done",
              text,
              progress: 100,
              isPdf: true,
            });
          } else {
            // Image: use Tesseract OCR
            const url = URL.createObjectURL(file);
            text = await runOCR(url, (p) => {
              updateFileStatus(fileIndex, { progress: p });
            });
            URL.revokeObjectURL(url);
            updateFileStatus(fileIndex, {
              status: "done",
              text,
              progress: 100,
            });
          }
          allTexts.push(text);
        } catch (e) {
          updateFileStatus(fileIndex, {
            status: "error",
            error: `Uitlezen mislukt: ${e instanceof Error ? e.message : "Onbekende fout"}`,
          });
        }
      }

      // Re-parse all accumulated texts together
      setFileStatuses((current) => {
        const allDoneTexts = current
          .filter((fs) => fs.status === "done")
          .map((fs) => fs.text);
        const combined = allDoneTexts.join("\n");
        const parsed = parseMonthlyScheduleText(combined);
        // Sort by date
        parsed.sort((a, b) => a.date.localeCompare(b.date));
        // Deduplicate by date
        const seen = new Set<string>();
        const unique = parsed.filter((d) => {
          if (seen.has(d.date)) return false;
          seen.add(d.date);
          return true;
        });
        setParsedDays(unique);
        return current;
      });

      setIsProcessing(false);
    },
    [fileStatuses.length, updateFileStatus],
  );

  const handleFilesSelected = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const validFiles = Array.from(files).filter(
        (f) => f.type.startsWith("image/") || f.type === "application/pdf",
      );
      if (validFiles.length > 0) processFiles(validFiles);
    },
    [processFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFilesSelected(e.dataTransfer.files);
    },
    [handleFilesSelected],
  );

  const updateParsedDay = useCallback(
    (index: number, field: keyof ParsedMonthlyDay, value: string | number) => {
      setParsedDays((prev) =>
        prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
      );
    },
    [],
  );

  const removeDay = useCallback((index: number) => {
    setParsedDays((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleApply = useCallback(() => {
    const entries: Record<string, DayEntry> = {};
    for (const day of parsedDays) {
      entries[day.date] = {
        startTime: day.startTime,
        endTime: day.endTime,
        breakMinutes: day.breakMinutes,
      };
    }
    onApply(entries);
    handleClose();
  }, [parsedDays, onApply, handleClose]);

  const workdayCount = parsedDays.length;
  const totalTravel = workdayCount * travelPerDay;
  const allDone = fileStatuses.length > 0 && !isProcessing;
  // Use scanYear to annotate imported data in UI display

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-w-3xl max-h-[92vh] overflow-y-auto"
        data-ocid="maand_scan.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar
              className="w-5 h-5"
              style={{ color: "oklch(0.72 0.165 55)" }}
            />
            Maand inscannen (urenbijlage)
          </DialogTitle>
          <DialogDescription>
            Upload screenshots of een <strong>PDF</strong> van je maandelijkse
            urenbijlage. Alleen &lsquo;Eendaags&rsquo; rijen worden verwerkt;
            vrije dagen (&lsquo;Bijzondere uren&rsquo;) worden genegeerd.
          </DialogDescription>
        </DialogHeader>

        {/* Jaar invoer */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/40">
          <label
            className="text-[13px] font-medium text-foreground shrink-0"
            htmlFor="maand-scan-year"
          >
            Jaar (voor weeknummers):
          </label>
          <Input
            id="maand-scan-year"
            type="number"
            min={2020}
            max={2035}
            value={scanYear}
            onChange={(e) => setScanYear(Number(e.target.value))}
            className="h-8 w-24 text-sm"
            data-ocid="maand_scan.year.input"
          />
          <span className="text-[12px] text-muted-foreground">
            Het jaar van de gescande uitdraai
          </span>
        </div>

        {/* Upload zone */}
        <button
          type="button"
          className="w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors"
          style={{ borderColor: "oklch(0.75 0.1 55 / 40%)" }}
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          data-ocid="maand_scan.dropzone"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.96 0.04 55)" }}
          >
            <Upload
              className="w-5 h-5"
              style={{ color: "oklch(0.52 0.18 55)" }}
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground text-[14px]">
              Klik om bestand(en) te uploaden
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Screenshots of PDF &mdash; meerdere bestanden tegelijk mogelijk
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              JPG, PNG, WEBP of <strong>PDF</strong> (PDF geeft beste resultaat)
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </button>

        {/* File statuses */}
        {fileStatuses.length > 0 && (
          <div className="space-y-2">
            <p
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ color: "var(--muted-foreground)" }}
            >
              Bestanden verwerken
            </p>
            {fileStatuses.map((fs, i) => (
              <div
                key={`${fs.file.name}-${i}`}
                className="rounded-lg border border-border p-3 flex items-center gap-3"
              >
                {fs.isPdf ? (
                  <FileText
                    className="w-4 h-4 shrink-0"
                    style={{ color: "oklch(0.52 0.18 240)" }}
                  />
                ) : (
                  <FileImage className="w-4 h-4 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">
                    {fs.file.name}
                    {fs.isPdf && (
                      <span
                        className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background: "oklch(0.93 0.05 240)",
                          color: "oklch(0.42 0.14 240)",
                        }}
                      >
                        PDF
                      </span>
                    )}
                  </p>
                  {fs.status === "scanning" && (
                    <div className="mt-1.5">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${fs.progress}%`,
                            background: "oklch(0.72 0.165 55)",
                          }}
                        />
                      </div>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "oklch(0.52 0.14 55)" }}
                      >
                        {fs.isPdf
                          ? "PDF uitlezen..."
                          : `OCR bezig... ${fs.progress}%`}
                      </p>
                    </div>
                  )}
                  {fs.status === "done" && (
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "oklch(0.42 0.16 145)" }}
                    >
                      Verwerkt{fs.isPdf ? " (PDF, directe extractie)" : ""}
                    </p>
                  )}
                  {fs.status === "error" && (
                    <p className="text-[11px] mt-0.5 text-destructive">
                      {fs.error}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {fs.status === "scanning" && (
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      style={{ color: "oklch(0.72 0.165 55)" }}
                    />
                  )}
                  {fs.status === "done" && (
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: "oklch(0.42 0.16 145)" }}
                    />
                  )}
                  {fs.status === "error" && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add more button */}
        {fileStatuses.length > 0 && !isProcessing && (
          <button
            type="button"
            className="flex items-center gap-2 text-[13px] font-medium transition-colors"
            style={{ color: "oklch(0.52 0.18 55)" }}
            onClick={() => fileRef.current?.click()}
            data-ocid="maand_scan.upload_button"
          >
            <Plus className="w-4 h-4" />
            Meer bestanden toevoegen
          </button>
        )}

        {/* Parsed results preview */}
        {allDone && parsedDays.length > 0 && (
          <div className="space-y-3">
            {/* Summary banner */}
            <div
              className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{
                background: "oklch(0.97 0.025 145)",
                borderColor: "oklch(0.85 0.08 145)",
              }}
            >
              <CheckCircle2
                className="w-5 h-5 shrink-0"
                style={{ color: "oklch(0.42 0.16 145)" }}
              />
              <div className="flex-1">
                <p
                  className="text-[14px] font-semibold"
                  style={{ color: "oklch(0.30 0.14 145)" }}
                >
                  {workdayCount} werkda{workdayCount === 1 ? "g" : "gen"}{" "}
                  herkend
                </p>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: "oklch(0.46 0.12 145)" }}
                >
                  Controleer de tijden en verwijder eventuele foutieve rijen
                  voor je importeert.
                </p>
              </div>
              <div
                className="text-right shrink-0 rounded-lg px-3 py-2 border"
                style={{
                  background: "oklch(0.94 0.06 145)",
                  borderColor: "oklch(0.82 0.12 145)",
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: "oklch(0.46 0.14 145)" }}
                >
                  Totaal reiskosten
                </p>
                <p
                  className="text-[18px] font-bold tabular-nums"
                  style={{ color: "oklch(0.32 0.16 145)" }}
                >
                  €
                  {totalTravel.toLocaleString("nl-NL", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: "oklch(0.50 0.12 145)" }}
                >
                  €{travelPerDay.toFixed(2).replace(".", ",")} × {workdayCount}d
                </p>
              </div>
            </div>

            {/* Editable table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div
                className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide"
                style={{
                  background: "oklch(0.96 0.02 240)",
                  color: "oklch(0.46 0.07 240)",
                }}
              >
                Herkende werkdagen — pas aan indien nodig
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: "oklch(0.98 0.01 240)" }}>
                      <TableHead className="text-[11px] py-2 px-3 font-semibold">
                        Datum
                      </TableHead>
                      <TableHead className="text-[11px] py-2 px-3 font-semibold">
                        Dag
                      </TableHead>
                      <TableHead className="text-[11px] py-2 px-3 font-semibold">
                        Begin
                      </TableHead>
                      <TableHead className="text-[11px] py-2 px-3 font-semibold">
                        Eind
                      </TableHead>
                      <TableHead className="text-[11px] py-2 px-3 font-semibold">
                        Pauze
                      </TableHead>
                      <TableHead className="text-[11px] py-2 px-3 font-semibold">
                        Reiskosten
                      </TableHead>
                      <TableHead className="text-[11px] py-2 px-3" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedDays.map((day, i) => (
                      <TableRow
                        key={day.date}
                        data-ocid={`maand_scan.item.${i + 1}`}
                      >
                        <TableCell className="py-2 px-3 text-[13px] font-medium text-foreground">
                          {formatDateNL(day.date)}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-[13px] text-muted-foreground font-medium">
                          {getDayNameFromDate(day.date)}
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(e) =>
                              updateParsedDay(i, "startTime", e.target.value)
                            }
                            className="h-7 text-[12px] w-28"
                            data-ocid="maand_scan.input"
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(e) =>
                              updateParsedDay(i, "endTime", e.target.value)
                            }
                            className="h-7 text-[12px] w-28"
                            data-ocid="maand_scan.input"
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={180}
                              value={day.breakMinutes}
                              onChange={(e) =>
                                updateParsedDay(
                                  i,
                                  "breakMinutes",
                                  Number(e.target.value),
                                )
                              }
                              className="h-7 text-[12px] w-16"
                              data-ocid="maand_scan.input"
                            />
                            <span className="text-[11px] text-muted-foreground">
                              min
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <span
                            className="text-[12px] font-semibold"
                            style={{ color: "oklch(0.42 0.16 145)" }}
                          >
                            €{travelPerDay.toFixed(2).replace(".", ",")}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => removeDay(i)}
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Verwijder rij"
                            data-ocid="maand_scan.delete_button"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totaal rij */}
                    <TableRow style={{ background: "oklch(0.97 0.02 145)" }}>
                      <TableCell
                        colSpan={3}
                        className="py-2.5 px-3 text-[12px] font-bold"
                        style={{ color: "oklch(0.38 0.14 145)" }}
                      >
                        Totaal: {workdayCount} werkdag
                        {workdayCount !== 1 ? "en" : ""}
                      </TableCell>
                      <TableCell colSpan={2} className="py-2.5 px-3" />
                      <TableCell
                        className="py-2.5 px-3 text-[12px] font-bold"
                        style={{ color: "oklch(0.38 0.14 145)" }}
                      >
                        €
                        {totalTravel.toLocaleString("nl-NL", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* No results */}
        {allDone && parsedDays.length === 0 && (
          <div
            className="rounded-xl border p-4 flex items-start gap-3"
            style={{
              background: "oklch(0.97 0.03 55)",
              borderColor: "oklch(0.86 0.09 55)",
            }}
            data-ocid="maand_scan.error_state"
          >
            <AlertCircle
              className="w-5 h-5 shrink-0 mt-0.5"
              style={{ color: "oklch(0.52 0.18 55)" }}
            />
            <div>
              <p
                className="text-[13px] font-semibold"
                style={{ color: "oklch(0.38 0.16 55)" }}
              >
                Geen werkdagen herkend
              </p>
              <p
                className="text-[12px] mt-1"
                style={{ color: "oklch(0.50 0.12 55)" }}
              >
                Zorg dat het bestand de kolommen &ldquo;Datum&rdquo;,
                &ldquo;Omschrijving&rdquo; (met &ldquo;Eendaags&rdquo;) en
                &ldquo;Tijd&rdquo; bevat. Een PDF geeft het beste resultaat. Bij
                een foto: gebruik een scherpe, rechte opname.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button
            variant="outline"
            onClick={handleClose}
            data-ocid="maand_scan.cancel_button"
          >
            Annuleren
          </Button>
          {fileStatuses.length > 0 && !isProcessing && (
            <Button
              variant="outline"
              onClick={reset}
              data-ocid="maand_scan.secondary_button"
            >
              Opnieuw beginnen
            </Button>
          )}
          {allDone && parsedDays.length > 0 && (
            <Button
              onClick={handleApply}
              style={{ background: "oklch(0.52 0.18 55)", color: "white" }}
              data-ocid="maand_scan.primary_button"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Importeren ({workdayCount} dag{workdayCount !== 1 ? "en" : ""})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
