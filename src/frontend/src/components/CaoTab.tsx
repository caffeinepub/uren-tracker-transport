import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Calculator,
  ChevronDown,
  Clock,
  FileText,
  Minus,
  PiggyBank,
  Search,
  Star,
  Umbrella,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

interface CaoArticle {
  id: string;
  category: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  rules: string[];
  percentages: { label: string; value: string }[];
  articleRef?: string;
}

const CAO_ARTICLES: CaoArticle[] = [
  {
    id: "loonberekening",
    category: "Loonberekening",
    title: "Uurloon & Loonschalen",
    icon: <Calculator className="w-4 h-4" />,
    color: "oklch(0.55 0.18 250)",
    articleRef: "Art. 14-18 CAO BGV 2026",
    rules: [
      "Het uurloon is gebaseerd op de toepasselijke loonschaal uit bijlage I van de CAO.",
      "Doordeweekse uren (ma-vr) tot aan de contracturen worden uitbetaald op 100% van het uurloon.",
      "Doordeweekse uren boven de contracturen (overuren) worden uitbetaald op 130% (100% basis + 30% overurentoeslag).",
      "Zaterdaguren worden altijd uitbetaald op 150% (100% basis + 50% zaterdagtoeslag).",
      "Zondaguren worden altijd uitbetaald op 200% (100% basis + 100% zondagtoeslag).",
      "Weekend-uren tellen nooit mee voor het vaststellen van overuren doordeweeks.",
      "Overuren worden uitbetaald in de volgende 4-wekenperiode (niet direct).",
    ],
    percentages: [
      { label: "Doordeweeks normaal", value: "100%" },
      { label: "Doordeweeks overuren", value: "130%" },
      { label: "Zaterdag", value: "150%" },
      { label: "Zondag", value: "200%" },
    ],
  },
  {
    id: "vakantie",
    category: "Vakantie",
    title: "Vakantiedagen & Vakantiegeld",
    icon: <Umbrella className="w-4 h-4" />,
    color: "oklch(0.55 0.18 140)",
    articleRef: "Art. 26-30 CAO BGV 2026",
    rules: [
      "Bij voltijd dienstverband (40 uur/week) heeft de werknemer recht op 25 vakantiedagen per jaar.",
      "Bij parttime dienstverband worden de vakantiedagen naar rato berekend (% van voltijd x 25 dagen).",
      "Vakantiegeld bedraagt 11,84% over het bruto loon inclusief alle toeslagen en overuren.",
      "Vakantiegeld wordt wekelijks opgebouwd en in mei uitbetaald (tenzij anders overeengekomen).",
      "Niet-opgenomen vakantiedagen kunnen worden meegenomen naar het volgend jaar (tot een maximum).",
      "Bij einde dienstverband worden resterende vakantiedagen uitbetaald.",
    ],
    percentages: [
      { label: "Vakantiegeld over bruto", value: "11,84%" },
      { label: "Vakantiedagen voltijd", value: "25 dagen" },
    ],
  },
  {
    id: "pensioen",
    category: "Pensioen",
    title: "Pensioenopbouw (Pensioenfonds Vervoer)",
    icon: <PiggyBank className="w-4 h-4" />,
    color: "oklch(0.55 0.18 55)",
    articleRef: "Pensioenreglement Vervoer 2026",
    rules: [
      "Alle werknemers in het beroepsgoederenvervoer vallen onder Pensioenfonds Vervoer.",
      "De pensioengrondslag = pensioengevend salaris minus de franchise (EUR 17.283 in 2026).",
      "Opbouwpercentage: 1,788% van de pensioengrondslag per jaar (Factor A).",
      "De werknemersbijdrage bedraagt 10,16% van het pensioengevend salaris.",
      "Het pensioengevend salaris omvat het basisloon plus structurele toeslagen en overuren.",
      "De Factor A is de jaarlijkse pensioenaangroei zoals vermeld op het Uniform Pensioenoverzicht (UPO).",
      "Jaarruimte voor extra pensioensparen = (30% x premiegrondslag) - (6,27 x Factor A).",
    ],
    percentages: [
      { label: "Werknemersbijdrage pensioen", value: "10,16%" },
      { label: "Opbouwpercentage (Factor A)", value: "1,788%" },
      { label: "Franchise 2026", value: "EUR 17.283" },
    ],
  },
  {
    id: "overuren",
    category: "Overuren",
    title: "Overuren & Uitbetaling",
    icon: <Clock className="w-4 h-4" />,
    color: "oklch(0.55 0.18 300)",
    articleRef: "Art. 19-22 CAO BGV 2026",
    rules: [
      "Overuren zijn uren gewerkt boven de overeengekomen contracturen per week.",
      "Alleen doordeweekse (maandag t/m vrijdag) uren boven de contracturen tellen als overuren.",
      "Zaterdag- en zondaguren tellen nooit mee voor de overurendrempel.",
      "Op overuren (doordeweeks boven contract) is een toeslag van 30% van toepassing - totaal 130%.",
      "Overuren en bijbehorende toeslagen worden uitbetaald in de eerstvolgende 4-wekenperiode.",
      "De werkgever is verplicht de overuren schriftelijk te registreren en te bevestigen.",
      "Overurencompensatie mag niet worden omgezet in verlof, tenzij de werknemer hiermee instemt.",
    ],
    percentages: [
      { label: "Overurentoeslag doordeweeks", value: "+30%" },
      { label: "Totaaltarief overuren", value: "130%" },
      { label: "Uitbetaling vertraging", value: "4 weken" },
    ],
  },
  {
    id: "toeslagen",
    category: "Toeslagen",
    title: "Dag- & Nachttoeslagen",
    icon: <Star className="w-4 h-4" />,
    color: "oklch(0.55 0.18 20)",
    articleRef: "Art. 23-25 CAO BGV 2026",
    rules: [
      "Zaterdagtoeslag: 50% over het basisuurloon voor alle op zaterdag gewerkte uren.",
      "Zondagtoeslag: 100% over het basisuurloon voor alle op zondag gewerkte uren.",
      "Zaterdag- en zondagtoeslag gelden altijd, ongeacht of de contracturen al bereikt zijn.",
      "Nachttoeslag (minimaal conform CAO): 19% over het basisuurloon voor uren tussen 21:00 en 05:00.",
      "Nachttoeslag kan per bedrijf hoger zijn (bijv. 30%) conform afspraken in de arbeidsovereenkomst.",
      "Nachttoeslag wordt gecombineerd met de dagbonus (bijv. nacht + zondag = 200% + 19%).",
      "Feestdagen worden gelijkgesteld aan zondag: 200% van het uurloon.",
    ],
    percentages: [
      { label: "Zaterdagtoeslag", value: "+50%" },
      { label: "Zondagtoeslag", value: "+100%" },
      { label: "Nachttoeslag (minimaal)", value: "+19%" },
      { label: "Feestdagtoeslag", value: "+100%" },
    ],
  },
  {
    id: "inhoudingen",
    category: "Inhoudingen",
    title: "Inhoudingen & Premies",
    icon: <Minus className="w-4 h-4" />,
    color: "oklch(0.55 0.15 0)",
    articleRef: "Art. 31-35 + Belastingwet 2026",
    rules: [
      "Pensioenpremie werknemersdeel: 10,16% van het pensioengevend salaris.",
      "WIA-Hiaat verzekering: 0,90% van het bruto loon (arbeidsongeschiktheidsverzekering aanvullend).",
      "SOOB-bijdrage (Sociaal Fonds): 0,245% van het bruto loon.",
      "Gedifferentieerde premie Whk (Werkhervatting Gedeeltelijk Arbeidsgeschikten): 0,52%.",
      "Loonheffing regulier loon: effectief laag tarief door heffingskortingen (algemeen EUR 3.068 + arbeidskorting EUR 5.599 in 2026).",
      "Bijzonder tarief loonheffing: 40,20% op extra/uitgestelde betalingen (overuren, vakantiegeld, correcties).",
      "Reiskosten zijn belastingvrij (max. EUR 0,23/km of werkelijke kosten per OV).",
    ],
    percentages: [
      { label: "Pensioenpremie (werknemer)", value: "10,16%" },
      { label: "WIA-Hiaat", value: "0,90%" },
      { label: "SOOB", value: "0,245%" },
      { label: "Whk premie", value: "0,52%" },
      { label: "Bijzonder tarief loonheffing", value: "40,20%" },
      { label: "Regulier belastingtarief (schijf 1)", value: "35,75%" },
    ],
  },
];

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, idx) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={`hl-${idx}-${part.slice(0, 8)}`}
        className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function ArticleCard({
  article,
  searchQuery,
  defaultOpen,
}: {
  article: CaoArticle;
  searchQuery: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
        <CollapsibleTrigger asChild>
          <CardHeader
            className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
            data-ocid="cao.article.toggle"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: article.color }}
                >
                  {article.icon}
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {highlight(article.title, searchQuery)}
                  </CardTitle>
                  {article.articleRef && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {article.articleRef}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-wrap gap-1">
                  {article.percentages.slice(0, 2).map((p) => (
                    <Badge
                      key={p.label}
                      variant="secondary"
                      className="text-[10px] font-bold"
                    >
                      {p.value}
                    </Badge>
                  ))}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="border-t border-border/50 pt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {article.percentages.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-1"
                  >
                    <span className="text-[11px] text-muted-foreground">
                      {p.label}:
                    </span>
                    <span
                      className="text-[12px] font-bold"
                      style={{ color: article.color }}
                    >
                      {p.value}
                    </span>
                  </div>
                ))}
              </div>
              <ul className="space-y-1.5">
                {article.rules.map((rule, idx) => (
                  <li
                    key={`${article.id}-rule-${idx}`}
                    className="flex items-start gap-2 text-[13px] text-foreground/80"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: article.color }}
                    />
                    {highlight(rule, searchQuery)}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function CaoTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedText] = useState<string | null>(() =>
    localStorage.getItem("cao_full_text"),
  );
  const [uploadedOpen, setUploadedOpen] = useState(false);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return CAO_ARTICLES;
    const q = searchQuery.toLowerCase();
    return CAO_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.rules.some((r) => r.toLowerCase().includes(q)) ||
        a.percentages.some(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.value.toLowerCase().includes(q),
        ),
    );
  }, [searchQuery]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
          CAO Artikelen 2026
        </h1>
        <p className="text-sm text-muted-foreground">
          CAO Beroepsgoederenvervoer over de Weg - relevante artikelen voor
          loonberekening
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op artikel, percentage of toeslag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-ocid="cao.search_input"
        />
      </div>

      <AnimatePresence mode="popLayout">
        {filteredArticles.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center py-12 text-muted-foreground"
            data-ocid="cao.empty_state"
          >
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Geen artikelen gevonden voor "{searchQuery}"
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
            data-ocid="cao.list"
          >
            {filteredArticles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ArticleCard
                  article={article}
                  searchQuery={searchQuery}
                  defaultOpen={!!searchQuery.trim()}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {uploadedText && (
        <Collapsible open={uploadedOpen} onOpenChange={setUploadedOpen}>
          <Card className="overflow-hidden border-dashed border-2 border-border/60">
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
                data-ocid="cao.uploaded.toggle"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Geupload CAO (eigen PDF)
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Volledige tekst van uw geuploadede CAO-bestand
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      uploadedOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4 px-4">
                <div className="border-t border-border/50 pt-3">
                  <pre
                    className="text-[12px] text-foreground/70 whitespace-pre-wrap break-words font-mono max-h-96 overflow-y-auto bg-muted/30 rounded p-3"
                    data-ocid="cao.uploaded.panel"
                  >
                    {searchQuery.trim()
                      ? highlight(uploadedText, searchQuery)
                      : uploadedText}
                  </pre>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
