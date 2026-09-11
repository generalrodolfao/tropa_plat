"use client"

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flag, CheckCircle2, Circle, Crosshair, Clock, FlaskConical } from "lucide-react";
import { pdiApi } from "@/lib/api/service";
import type { PdiJourney } from "@/lib/api/client";

export default function PdiPage() {
  const [journey, setJourney] = useState<PdiJourney | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([pdiApi.getJourney(), pdiApi.getPlan()])
      .then(([j, p]) => {
        if (!active) return;
        if (j.status === "fulfilled") setJourney(j.value);
        if (p.status === "fulfilled") setPlan(p.value);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const skills = useMemo(
    () =>
      (journey?.skills ?? []).map((s) => ({
        id: s.skillId,
        name: s.name,
        level: s.level,
        target: s.targetLevel,
        gap: Math.max(0, s.targetLevel - s.level),
      })),
    [journey],
  );

  const done = skills.filter((s) => s.level >= s.target).length;
  const totalProgress = journey ? Math.round((journey.overall.averageLevel / 5) * 100) : 0;

  // Preferência: plano salvo (IA); fallback: rota derivada do gap de skills
  const route = useMemo(() => {
    if (plan?.nodes?.length) {
      return plan.nodes.map((n: any) => ({
        id: n.id,
        name: n.title,
        level: 0,
        target: 0,
        gap: 0,
        fromPlan: true,
        description: n.recommendedContent?.description ?? "",
        status: n.status === "done" ? ("done" as const) : n.status === "in_progress" ? ("in_progress" as const) : ("todo" as const),
      }));
    }
    const sorted = [...skills].sort((a, b) => b.gap - a.gap);
    const inProgressId = sorted.find((s) => s.gap > 0)?.id;
    return sorted.map((s) => ({
      ...s,
      fromPlan: false,
      description: "",
      status: s.gap === 0 ? ("done" as const) : s.id === inProgressId ? ("in_progress" as const) : ("todo" as const),
    }));
  }, [skills, plan]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Carregando PDI...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Plano de desenvolvimento</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">PDI</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Plano único · gerado a partir do seu CV + quiz de nivelamento · revisado a cada trimestre
          </p>
        </div>
        <div className="hud-corners flex items-center gap-5 rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Skills</div>
            <div className="font-display text-2xl font-bold text-foreground">
              {done}/{skills.length}
            </div>
          </div>
          <div className="w-28">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Progresso</div>
            <Progress value={totalProgress} className="mt-2 h-1.5" />
          </div>
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nível médio</div>
            <div className="font-display text-2xl font-bold text-primary">{journey?.overall.averageLevel ?? 0}</div>
          </div>
        </div>
      </div>

      {skills.length === 0 ? (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-8 text-center">
            <FlaskConical className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold text-foreground">PDI ainda não gerado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete o quiz de nivelamento no onboarding para montar sua rota de evolução.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <Card className="hud-corners border-border/70 bg-card/70">
              <CardContent className="p-5">
                <div className="mb-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {plan?.nodes?.length ? "Plano salvo · gerado pela IA" : "Rota de evolução · priorizada pelo gap"}
                </div>
                <ol className="relative space-y-4 border-l border-border pl-6">
                  {route.map((n: any) => (
                    <li key={n.id} className="relative">
                      <span
                        className={`absolute -left-6 top-0 grid size-5 -translate-x-1/2 place-items-center rounded-full border ${
                          n.status === "done"
                            ? "border-accent bg-accent text-background"
                            : n.status === "in_progress"
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {n.status === "done" ? (
                          <CheckCircle2 className="size-3" />
                        ) : n.status === "in_progress" ? (
                          <Circle className="size-3 animate-pulse" />
                        ) : (
                          <Crosshair className="size-3" />
                        )}
                      </span>

                      <div
                        className={`rounded-lg border p-4 ${n.status === "done" ? "border-border/40 opacity-70" : "border-border/60 bg-muted/20"}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Crosshair className="size-4 text-primary" />
                            <span className="font-display text-sm font-semibold text-foreground">{n.name}</span>
                          </div>
                          {n.status === "done" ? (
                            <Badge variant="secondary" className="gap-1 px-2 py-0 text-[10px] text-accent">
                              <CheckCircle2 className="size-3" /> concluído
                            </Badge>
                          ) : n.status === "in_progress" ? (
                            <Badge className="gap-1 px-2 py-0 text-[10px]">em andamento</Badge>
                          ) : (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                              <Clock className="size-3" /> {n.fromPlan ? "próximo passo" : `faltam ${n.gap} nível(is)`}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {n.fromPlan
                            ? n.description || "Milestone do seu plano personalizado"
                            : `Nível ${n.level} de ${n.target}${n.gap > 0 ? ` · ${n.gap} nível(is) para a meta` : " · meta atingida"}`}
                        </p>
                        {n.status !== "done" && !n.fromPlan && (
                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-mono text-[11px] text-primary">+{n.gap * 100} XP</span>
                            {n.status === "in_progress" && (
                              <Button size="sm" variant="outline" className="h-7 px-3 text-xs">
                                Continuar
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <Card className="hud-corners border-border/70 bg-card/70">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Lacunas de skill
                  </div>
                  <Badge variant="outline" className="gap-1 font-mono text-[10px] text-primary">
                    <FlaskConical className="size-3" /> quiz IRT
                  </Badge>
                </div>
                <div className="mt-4 space-y-4">
                  {skills.map((s) => {
                    const complete = s.level >= s.target;
                    return (
                      <div key={s.id}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm text-foreground">{s.name}</span>
                          <span className={`font-mono text-xs ${complete ? "text-accent" : "text-muted-foreground"}`}>
                            {s.level}/{s.target} {!complete && `· falta ${s.gap}`}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full ${
                                i < s.level
                                  ? complete
                                    ? "bg-accent"
                                    : "bg-primary"
                                  : i < s.target
                                    ? "bg-destructive/50"
                                    : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Barras <span className="text-destructive">vermelhas</span> mostram o que falta para a próxima patente.
                </p>
              </CardContent>
            </Card>

            <Card className="hud-corners border-border/70 bg-card/70">
              <CardContent className="p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Próxima revisão
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                    <Flag className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Revisão de PDI</div>
                    <div className="font-mono text-[11px] text-muted-foreground">a cada 2 semanas · novo quiz de nivelamento</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
