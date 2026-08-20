import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Calendar, CheckCircle2, ChevronRight, CircleDot, Target, Medal } from "lucide-react";
import { HACKATHONS } from "@/lib/mock-inner";

const PHASES = [
  { n: "1", label: "Inscrição", desc: "Forme equipe de até 4 e escolha o dataset" },
  { n: "2", label: "Modelagem", desc: "Desenvolva a solução e faça submissões" },
  { n: "3", label: "Apresentação", desc: "Top 3 times apresentam para o júri" },
  { n: "4", label: "Premiação", desc: "Prêmio pago via Pix na semana seguinte" },
];

export default function HackathonsPage() {
  const active = HACKATHONS.find((h) => h.status === "ativo");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Centro de operações</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Hackathons</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Desafios patrocinados com prêmio em dinheiro · o sponsor paga, você resolve
          </p>
        </div>
        <Button className="gap-2">
          <CircleDot className="size-4" /> Inscrever nova equipe
        </Button>
      </div>

      {active && (
        <section className="hud-corners relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1.5 border-primary/50 bg-primary/15 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  Desafio ativo · Fase {active.phase}
                </Badge>
                <Badge variant="secondary" className="px-2.5 py-1 font-mono text-[11px]">
                  {active.phaseLabel}
                </Badge>
              </div>

              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {active.title}
              </h2>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">{active.theme}</p>
              <p className="mt-4 max-w-xl text-muted-foreground">{active.description}</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {active.skills.map((s) => (
                  <Badge key={s} variant="outline" className="font-mono text-[11px]">{s}</Badge>
                ))}
              </div>

              <div className="mt-6 grid max-w-lg grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                  <div className="font-mono text-xl font-bold text-primary">
                    R$ {active.prize.toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs text-muted-foreground">Prêmio total</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                  <div className="font-mono text-xl font-bold text-foreground">{active.daysLeft} dias</div>
                  <div className="text-xs text-muted-foreground">Prazo final</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                  <div className="font-mono text-xl font-bold text-foreground">Até {active.teamSize}</div>
                  <div className="text-xs text-muted-foreground">Por equipe</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="hud-corners rounded-xl border border-border/60 bg-background/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    <Users className="size-3.5" /> Minha equipe
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">3/4 membros</span>
                </div>
                <div className="mt-3 space-y-2">
                  {["Você (líder)", "Mariana C.", "Rafael T.", "Convite pendente…"].map((m) => (
                    <div key={m} className="flex items-center gap-2.5">
                      <div
                        className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[10px] font-semibold ${
                          m === "Convite pendente…"
                            ? "border-dashed border-border text-muted-foreground"
                            : "border-primary/40 bg-primary/10 text-primary"
                        }`}
                      >
                        {m === "Convite pendente…" ? "+" : m.charAt(0)}
                      </div>
                      <span className={`text-sm ${m === "Convite pendente…" ? "text-muted-foreground" : "text-foreground"}`}>{m}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full gap-1.5">
                  <Users className="size-3.5" /> Gerenciar equipe
                </Button>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    <Target className="size-3.5" /> Submissões
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">3 usadas / 20 por hora</span>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { t: "baseline_v1.ipynb", s: "Avaliado · 0.72" },
                    { t: "baseline_v2.ipynb", s: "Avaliado · 0.78" },
                    { t: "feature_eng_v3.ipynb", s: "Rodando…" },
                  ].map((sub) => (
                    <div key={sub.t} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                      <span className="truncate font-mono text-xs text-foreground">{sub.t}</span>
                      <span className="font-mono text-[11px] text-accent">{sub.s}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" className="mt-4 w-full gap-1.5">
                  Submeter solução <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <Tabs defaultValue="fases">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="fases">Como funciona</TabsTrigger>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="fases" className="mt-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-5">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Ciclo de um hackathon
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PHASES.map((p, i) => (
                  <div key={p.n} className="relative rounded-lg border border-border/60 bg-muted/20 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">Fase {p.n}</span>
                      {i < Number(active!.phase) && <CheckCircle2 className="size-4 text-accent" />}
                    </div>
                    <div className="font-display text-sm font-semibold text-foreground">{p.label}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                <Trophy className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  O prêmio é pago pelo <span className="font-medium text-foreground">patrocinador</span>, nunca pela
                  plataforma. Estruturação legal de <span className="font-medium text-foreground">concurso cultural</span> —
                  regulamento aprovado e divulgado antes da abertura.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proximos" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {HACKATHONS.filter((h) => h.status === "proximo").map((h) => (
              <HackathonCard key={h.id} h={h} upcoming />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <div className="space-y-3">
            {HACKATHONS.filter((h) => h.status === "encerrado").map((h) => (
              <Card key={h.id} className="hud-corners border-border/70 bg-card/70">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-4">
                    <div className="grid size-11 place-items-center rounded-lg border border-border bg-muted">
                      <Medal className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-display text-base font-semibold text-foreground">{h.title}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {h.sponsor} · {h.teamSize}º lugar do seu time
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="px-2.5 py-1 font-mono text-[11px]">
                    Encerrado
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HackathonCard({ h, upcoming }: { h: (typeof HACKATHONS)[0]; upcoming?: boolean }) {
  return (
    <Card className="hud-corners border-border/70 bg-card/70">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-md border border-primary/30 bg-primary/10 font-mono text-xs font-bold text-primary">
              {h.sponsorLogo}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">{h.sponsor}</span>
          </div>
          <Badge variant="outline" className="gap-1 px-2.5 py-1 font-mono text-[11px] text-primary">
            <Calendar className="size-3" /> {h.daysLeft} dias
          </Badge>
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">{h.title}</h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{h.theme}</p>
        <p className="mt-3 text-sm text-muted-foreground">{h.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-primary">
            R$ {h.prize.toLocaleString("pt-BR")}
          </span>
          <Button asChild={upcoming} size="sm" className="gap-1.5">
            <span className="flex items-center gap-1.5">
              {upcoming ? "Garantir vaga" : "Ver detalhes"} <ChevronRight className="size-3.5" />
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}