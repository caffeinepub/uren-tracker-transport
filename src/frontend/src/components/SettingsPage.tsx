import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Save } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Settings } from "../types";

interface SettingsPageProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function SettingsPage({ settings, onSave }: SettingsPageProps) {
  const [form, setForm] = useState<Settings>(settings);

  const handleSave = () => {
    onSave(form);
    toast.success("Instellingen opgeslagen");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <Card
        className="border-border shadow-card rounded-xl overflow-hidden"
        data-ocid="settings.card"
      >
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-[15px]">
            Loon instellingen
          </h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Pas je loonschaal en vergoedingen aan
          </p>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="text-[13px] font-medium mb-1.5 block">
                Uurloon (€)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.hourlyRate}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    hourlyRate: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className="h-10"
                data-ocid="settings.input"
              />
              <p className="text-[12px] text-muted-foreground mt-1">
                Loonschaal D6 — uurloon €20,24
              </p>
            </div>
            <div>
              <Label className="text-[13px] font-medium mb-1.5 block">
                Reiskosten per dag (€)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.travelAllowancePerDay}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    travelAllowancePerDay:
                      Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className="h-10"
                data-ocid="settings.input"
              />
              <p className="text-[12px] text-muted-foreground mt-1">
                €10,12 per gewerkte dag (32 km woon-werk)
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="bg-orange hover:bg-orange-light text-white font-semibold h-10 px-5"
            data-ocid="settings.submit_button"
          >
            <Save className="w-4 h-4 mr-2" />
            Opslaan
          </Button>
        </div>
      </Card>

      {/* CAO info card */}
      <Card className="border-border shadow-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Info className="w-4 h-4 text-orange" />
          <h3 className="font-semibold text-foreground text-[15px]">
            CAO Informatie
          </h3>
        </div>
        <div className="p-5 space-y-3 text-[13px] text-muted-foreground">
          <p className="font-semibold text-foreground">
            CAO Beroepsgoederenvervoer — Loonschaal D6 (60% parttime)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow label="Uurloon" value="€20,24" />
            <InfoRow label="Normaal (≤ 8u/dag)" value="100% (basissalaris)" />
            <InfoRow label="Overwerk 1e 2 uur" value="125% (× 1,25)" />
            <InfoRow label="Overwerk daarna" value="150% (× 1,50)" />
            <InfoRow label="Avond 18:00-22:00" value="+30% toeslag" />
            <InfoRow label="Nacht 22:00-06:00" value="+50% toeslag" />
            <InfoRow label="Zaterdag" value="+25% op alles" />
            <InfoRow label="Zondag" value="+50% op alles" />
            <InfoRow label="Vakantiegeld opbouw" value="11,84%" />
            <InfoRow label="Reiskosten" value="€10,12 per werkdag" />
          </div>
          <p className="text-[12px] mt-2 text-muted-foreground/70">
            Bijzonder tarief: 40,20%. Pensioenpremie werknemer: 10,16%
            (WIA-Hiaat 0,90%, SOOB 0,245%). Toeslagen zijn cumulatief van
            toepassing.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
