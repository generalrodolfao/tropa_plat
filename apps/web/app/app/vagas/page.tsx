import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Briefcase, MapPin, Search, SlidersHorizontal, Zap, FileText, ChevronRight } from "lucide-react";
import { VAGAS } from "@/lib/mock-inner";

export default function VagasPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Fit-score por IA</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Mural de vagas</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Seu CV é analisado contra cada vaga · easy-apply em um clique
          </p>
        </div>
        <div className="hud-corners flex items-center gap-3 rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <div className="grid size-10 place-items-center rounded-full border border-primary/50 bg-primary/15 font-mono text-sm font-bold text-primary">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">rodolfo_cv.pdf</div>
            <div className="font-mono text-[11px] text-accent">CV atual · revisado há 2 dias</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por cargo, empresa ou skill…" className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="size-4" /> Filtros
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="px-3 py-1">Todos ({VAGAS.length})</Badge>
        <Badge variant="outline" className="px-3 py-1 font-mono text-[11px] text-accent">fit ≥ 70</Badge>
        <Badge variant="outline" className="px-3 py-1 font-mono text-[11px] text-foreground">Remoto</Badge>
        <Badge variant="outline" className="px-3 py-1 font-mono text-[11px] text-foreground">Júnior</Badge>
      </div>

      <div className="space-y-3">
        {VAGAS.map((v) => {
          const high = v.fitScore >= 75;
          const mid = v.fitScore >= 55;
          return (
            <Card key={v.id} className={`hud-corners border-border/70 bg-card/70 ${high ? "border-accent/40" : ""}`}>
              <CardContent className="flex flex-wrap items-center gap-5 p-5">
                <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 font-display text-base font-bold text-primary">
                  {v.companyLogo}
                </div>

                <div className="min-w-48 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">{v.title}</h3>
                    <span className="font-mono text-[11px] text-muted-foreground">{v.seniority}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>{v.company}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {v.location}
                    </span>
                    <Badge variant="secondary" className="px-2 py-0 text-[10px]">{v.mode}</Badge>
                    <span className="font-mono text-xs text-foreground">{v.salary}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.skills.map((s) => (
                      <Badge key={s} variant="outline" className="px-2 py-0 font-mono text-[10px]">{s}</Badge>
                    ))}
                    {v.tags.map((t) => (
                      <Badge key={t} className="px-2 py-0 text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>

                <div className="w-40">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      <Zap className="size-3" /> fit-score
                    </span>
                    <span className={`font-mono text-lg font-bold ${high ? "text-accent" : mid ? "text-primary" : "text-muted-foreground"}`}>
                      {v.fitScore}
                    </span>
                  </div>
                  <Progress
                    value={v.fitScore}
                    className="h-1.5"
                    indicatorClassName={high ? "bg-accent" : mid ? "bg-primary" : "bg-muted-foreground"}
                  />
                  <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                    {high ? "forte candidatura" : mid ? "bom perfil" : "faltam skills"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button className="gap-1.5">
                    Candidatar <ChevronRight className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                    <Briefcase className="size-3.5" /> Ver detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="hud-corners flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
        <Zap className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="text-sm text-muted-foreground">
          O fit-score cruza seu <span className="font-medium text-foreground">PDI + CV</span> com os requisitos da
          vaga. Não é sorteio — é o mapa de onde você já está pronto para entrar.
        </p>
      </div>
    </div>
  );
}