import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Swords, ArrowUpRight, ArrowDownRight, Minus, Crown, Shield, Medal } from "lucide-react";
import { LEAGUE, RANK_LADDER, currentRank } from "@/lib/mock-data";

const XP_TOTAL = 1240;

export default function LigasPage() {
  const { current, next, progress } = currentRank(XP_TOTAL);
  const promotion = Math.ceil(LEAGUE.members.length * 0.15);
  const relegation = Math.ceil(LEAGUE.members.length * 0.15);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Batalhão semanal</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Ligas</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {LEAGUE.week} · {LEAGUE.members.length} soldados no batalhão
          </p>
        </div>
        <div className="hud-corners flex items-center gap-5 rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Sua posição</div>
            <div className="font-display text-2xl font-bold text-primary">3º</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Patente</div>
            <div className="font-display text-2xl font-bold text-foreground">{current.title}</div>
          </div>
          <div className="w-24">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Próx: {next.title}</div>
            <Progress value={progress} className="mt-2 h-1.5" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="ranking">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="patentes">Patentes</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="mt-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-0">
              <div className="grid grid-cols-[48px_1fr_80px_64px] items-center gap-3 border-b border-border/60 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Pos</span>
                <span>Soldado</span>
                <span className="text-right">XP</span>
                <span className="text-right">Var</span>
              </div>
              <ul className="divide-y divide-border/50">
                {LEAGUE.members.map((m) => {
                  const isPromo = m.rank <= promotion;
                  const isReleg = m.rank > LEAGUE.members.length - relegation;
                  const zone =
                    m.rank === 1
                      ? "border-accent/60"
                      : isPromo
                        ? "border-accent/30"
                        : isReleg
                          ? "border-destructive/30"
                          : "border-transparent";
                  return (
                    <li
                      key={m.rank}
                      className={`grid grid-cols-[48px_1fr_80px_64px] items-center gap-3 border-l-2 px-5 py-3 ${zone} ${m.you ? "bg-primary/10" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        {m.rank === 1 ? (
                          <Crown className="size-4 text-accent" />
                        ) : m.rank <= 3 ? (
                          <Medal className="size-4 text-primary" />
                        ) : (
                          <span className="w-4 text-center font-mono text-xs text-muted-foreground">{m.rank}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted font-mono text-xs font-semibold text-foreground">
                          {m.name.charAt(0)}
                        </div>
                        <span className={`truncate text-sm ${m.you ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {m.name}
                        </span>
                        {m.you && <Badge className="px-2 py-0 text-[10px]">você</Badge>}
                      </div>
                      <div className="text-right font-mono text-sm font-bold text-primary">
                        {m.xp.toLocaleString("pt-BR")}
                      </div>
                      <div className="flex justify-end">
                        {m.movement === "up" && <ArrowUpRight className="size-4 text-accent" />}
                        {m.movement === "down" && <ArrowDownRight className="size-4 text-destructive" />}
                        {m.movement === "same" && <Minus className="size-4 text-muted-foreground" />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="hud-corners rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                <ArrowUpRight className="size-3.5" /> Zona de promoção
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Top {promotion} ({promotion} soldados) sobem para o batalhão acima.
              </p>
            </div>
            <div className="hud-corners rounded-lg border border-border/70 bg-card/70 p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Shield className="size-3.5" /> Zona segura
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Mantenha sua posição para continuar no Batalhão Bravo.
              </p>
            </div>
            <div className="hud-corners rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-destructive">
                <ArrowDownRight className="size-3.5" /> Zona de rebaixamento
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Os últimos {relegation} soldados caem para o batalhão abaixo.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="patentes" className="mt-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="space-y-2 p-5">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Hierarquia da Tropa · XP acumulado
              </div>
              {RANK_LADDER.map((r, i) => {
                const reached = XP_TOTAL >= r.xp;
                const isCurrent = r.title === current.title;
                return (
                  <div
                    key={r.title}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${isCurrent ? "border-primary/50 bg-primary/10" : "border-border/60 bg-muted/20"}`}
                  >
                    <span className={`font-mono text-xs font-bold ${reached ? "text-primary" : "text-muted-foreground"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <div className={`font-display text-sm font-semibold ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                        {r.title}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {r.xp.toLocaleString("pt-BR")} XP
                    </span>
                    {isCurrent && <Badge className="px-2 py-0 text-[10px]">atual</Badge>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Cohort de 30–50 soldados", d: "Cada semana forma um novo batalhão com soldados do mesmo nível de XP." },
              { t: "Promoção automática", d: "Top 15% sobe de liga na segunda-feira. Novatos ficam 1 semana na liga atual." },
              { t: "Rebaixamento justo", d: "Últimos 15% caem. Sem atividade a semana conta como 0 XP." },
              { t: "XP da semana", d: "Conta tudo: aulas, quizzes, sandbox, projetos e hackathons. Streak dá bônus." },
              { t: "Placar ao vivo", d: "Atualizado em tempo real via websocket. Você vê cada ponto subir." },
              { t: "Bots de complemento", d: "Se faltar gente no batalhão, bots completam o cohort com XP fixo." },
            ].map((r) => (
              <div key={r.t} className="hud-corners rounded-lg border border-border/70 bg-card/70 p-4">
                <div className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <Swords className="size-4 text-primary" /> {r.t}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.d}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}