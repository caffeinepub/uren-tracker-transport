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
  AlertCircle,
  CheckCircle2,
  FileImage,
  Info,
  Loader2,
  ScanLine,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { DayEntry } from "../types";
import { mapParsedDaysToWeek, parseScheduleText } from "../utils/parseSchedule";

const DAY_NL = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];

interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  weekDates: Date[];
  onApply: (entries: Record<string, DayEntry>) => void;
}

type ScanStatus = "idle" | "scanning" | "done" | "error";

async function runOCR(
  url: string,
  onProgress: (p: number) => void,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function ScanModal({
  open,
  onClose,
  weekDates,
  onApply,
}: ScanModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [parsedEntries, setParsedEntries] = useState<Record<string, DayEntry>>(
    {},
  );
  const [rawText, setRawText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const reset = useCallback(() => {
    setPreview(null);
    setStatus("idle");
    setProgress(0);
    setParsedEntries({});
    setRawText("");
    setErrorMsg("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      setStatus("scanning");
      setProgress(0);

      try {
        const text = await runOCR(url, setProgress);
        setRawText(text);

        const parsed = parseScheduleText(text);
        const mapped = mapParsedDaysToWeek(parsed, weekDates);

        setParsedEntries(mapped);
        setStatus("done");
      } catch {
        setStatus("error");
        setErrorMsg("OCR mislukt. Probeer een scherpere foto.");
      }
    },
    [weekDates],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (
        file &&
        (file.type.startsWith("image/") || file.type === "application/pdf")
      ) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleApply = useCallback(() => {
    onApply(parsedEntries);
    handleClose();
  }, [parsedEntries, onApply, handleClose]);

  const updateEntry = useCallback(
    (key: string, field: keyof DayEntry, value: string | number) => {
      setParsedEntries((prev) => ({
        ...prev,
        [key]: { ...prev[key], [field]: value },
      }));
    },
    [],
  );

  const parsedCount = Object.keys(parsedEntries).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-orange" />
            Uitdraai inscannen
          </DialogTitle>
          <DialogDescription>
            Upload een foto of bestand van de werkuitdraai van je werkgever. De
            app leest automatisch de tijden uit en vult de week in.
          </DialogDescription>
        </DialogHeader>

        {/* Upload zone */}
        {!preview && status === "idle" && (
          <button
            type="button"
            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-colors hover:border-orange/50 hover:bg-orange/5 w-full"
            style={{ borderColor: "oklch(0.75 0.1 55 / 40%)" }}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.96 0.04 55)" }}
            >
              <Upload className="w-6 h-6 text-orange" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">
                Klik om te uploaden
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">
                Of sleep een foto/bestand hierheen
              </p>
              <p className="text-[12px] text-muted-foreground/70 mt-2">
                JPG, PNG, WEBP of PDF
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleInputChange}
            />
          </button>
        )}

        {/* Preview + scan status */}
        {preview && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
              <img
                src={preview}
                alt="Uitdraai preview"
                className="w-full max-h-48 object-contain"
              />
              {status === "idle" && (
                <button
                  type="button"
                  onClick={reset}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Scanning progress */}
            {status === "scanning" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[14px] font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-orange" />
                  Tekst uitlezen… {progress}%
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      background: "oklch(0.72 0.165 55)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Done */}
            {status === "done" && (
              <div className="space-y-3">
                {parsedCount > 0 ? (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-success-bg">
                    <CheckCircle2 className="w-4 h-4 text-success-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-success-foreground">
                        {parsedCount} dag{parsedCount !== 1 ? "en" : ""}{" "}
                        gevonden
                      </p>
                      <p className="text-[12px] text-success-foreground/80 mt-0.5">
                        Controleer en pas de tijden aan voor je ze overneemt.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-amber-800">
                        Geen tijden herkend
                      </p>
                      <p className="text-[12px] text-amber-700 mt-0.5">
                        Probeer een scherpere foto, of voer de uren handmatig
                        in.
                      </p>
                    </div>
                  </div>
                )}

                {/* Editable parsed results */}
                {parsedCount > 0 && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-muted px-3 py-2 text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Herkende tijden — pas aan indien nodig
                    </div>
                    <div className="divide-y divide-border">
                      {weekDates.map((date) => {
                        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                        const entry = parsedEntries[key];
                        if (!entry) return null;
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2 px-3 py-2"
                          >
                            <span className="text-[13px] font-medium text-foreground w-20 shrink-0">
                              {DAY_NL[date.getDay()]}
                            </span>
                            <Input
                              data-ocid="scan.input"
                              type="time"
                              value={entry.startTime}
                              onChange={(e) =>
                                updateEntry(key, "startTime", e.target.value)
                              }
                              className="h-8 text-sm w-28"
                            />
                            <span className="text-muted-foreground text-sm shrink-0">
                              –
                            </span>
                            <Input
                              data-ocid="scan.input"
                              type="time"
                              value={entry.endTime}
                              onChange={(e) =>
                                updateEntry(key, "endTime", e.target.value)
                              }
                              className="h-8 text-sm w-28"
                            />
                            <Input
                              data-ocid="scan.input"
                              type="number"
                              min={0}
                              max={180}
                              value={entry.breakMinutes}
                              onChange={(e) =>
                                updateEntry(
                                  key,
                                  "breakMinutes",
                                  Number(e.target.value),
                                )
                              }
                              className="h-8 text-sm w-16"
                            />
                            <span className="text-[12px] text-muted-foreground shrink-0">
                              min pauze
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Info note + Raw OCR (collapsible) */}
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[12px] text-blue-700">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
                  <span>
                    De app leest alleen de <strong>bovenste tabel</strong> met
                    dag-tijden. Controleer en pas de tijden aan voor je ze
                    overneemt.
                  </span>
                </div>

                <details className="text-[12px]">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5" />
                    Ruwe OCR-tekst bekijken
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-muted text-[11px] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto font-mono text-muted-foreground">
                    {rawText || "(leeg)"}
                  </pre>
                </details>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-[13px] text-destructive">{errorMsg}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={handleClose}>
            Annuleren
          </Button>
          {status === "done" && parsedCount > 0 && (
            <Button
              data-ocid="scan.primary_button"
              onClick={handleApply}
              style={{ background: "oklch(0.72 0.165 55)", color: "white" }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Overnemen in week
            </Button>
          )}
          {(status === "done" || status === "error") && (
            <Button variant="outline" onClick={reset}>
              Nieuwe scan
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
