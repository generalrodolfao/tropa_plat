import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, RefreshCw, UploadCloud, AlertTriangle, CheckCircle2, Lightbulb, ScanSearch } from "lucide-react";
import { CV_REVIEW } from "@/lib/mock-inner";

function scoreColor(s: number) {
  if (s >= 85) return "text-accent";
  if (s >= 70) return "text-primary";
  if (s >= 50) return "text-yellow-500";
  return "text-destructive";
}

export default function CvPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Revisão com IA</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">CV em combate</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Análise contra vagas de dados · ATS-friendly · feedback por seção
          </p>
        </div>
        <Button className="gap-2">
          <RefreshCw className="size-4" /> Reanalisar CV
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.55fr_1fr]">
        <div className="space-y-4">
          <Card className="hud-corners relative overflow-hidden border-border/70 bg-card/70">
            <CardContent className="relative flex flex-col items-center p-6">
              <div className="pointer-events-none absolute right-0 top-0 size-48 rounded-full bg-accent/10 blur-3xl" />
              <div className="relative">
                <div className="relative mx-auto grid size-32 place-items-center rounded-full border-4 border-border bg-background/60">
                  <span className={`font-display text-5xl font-bold ${scoreColor(CV_REVIEW.overall)}`}>
                    {CV_REVIEW.overall}
                  </span>
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-background px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Score geral
                </span>
              </div>
              <div className="mt-8 w-full">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                    <ScanSearch className="size-3.5" /> Compatibilidade ATS
                  </span>
                  <span className={`font-mono text-sm font-bold ${scoreColor(CV_REVIEW.ats)}`}>{CV_REVIEW.ats}</span>
                </div>
                <Progress value={CV_REVIEW.ats} className="h-1.5" />
              </div>
              <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5">
                <FileText className="size-4 text-muted-foreground" />
                <span className="truncate font-mono text-xs text-muted-foreground">rodolfo_cv.pdf · 184 KB</span>
              </div>
            </CardContent>
          </Card>

          <div className="hud-corners rounded-xl border border-border/60 bg-card/70 p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Lightbulb className="size-3.5 text-accent" /> Resumo da IA
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{CV_REVIEW.summary}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {CV_REVIEW.sections.map((s) => (
              <Card key={s.name} className="hud-corners border-border/70 bg-card/70">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-foreground">{s.name}</span>
                    <span className={`font-mono text-xl font-bold ${scoreColor(s.score)}`}>{s.score}</span>
                  </div>
                  <Progress
                    value={s.score}
                    className="mt-3 h-1.5"
                    indicatorClassName={s.score >= 85 ? "bg-accent" : s.score >= 70 ? "bg-primary" : "bg-yellow-500"}
                  />
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{s.feedback}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <AlertTriangle className="size-3.5 text-yellow-500" /> Ajustes de alto impacto
              </div>
              <ul className="mt-4 space-y-3">
                {CV_REVIEW.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 font-mono text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">{imp}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button className="gap-2">
                  <UploadCloud className="size-4" /> Enviar novo CV
                </Button>
                <Button variant="outline" className="gap-2">
                  <CheckCircle2 className="size-4" /> Marcar como revisado
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
            <Badge variant="outline" className="shrink-0 border-accent/40 px-2 py-1 font-mono text-[10px] text-accent">
              em beta
            </Badge>
            <p className="text-sm text-muted-foreground">
              A revisão usa apenas o conteúdo do seu CV e o perfil das vagas do mural. Nada é usado para treinar modelos de terceiros.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}