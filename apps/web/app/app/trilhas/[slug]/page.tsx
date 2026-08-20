import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Terminal, Brain, Swords, Trophy, CheckCircle2, Clock, ChevronLeft, Lock } from "lucide-react";
import { COURSES } from "@/lib/mock-data";

export default async function TrilhaPage({ params }: PageProps<"/app/trilhas/[slug]">) {
  const { slug } = await params;
  const course = COURSES.find((c) => c.slug === slug);
  if (!course) notFound();

  const pct = Math.round((course.xpEarned / course.xpTotal) * 100);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1.5 text-muted-foreground">
          <Link href="/app">
            <ChevronLeft className="size-4" /> Painel de bordo
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-primary">{course.codename}</span>
              <Badge variant="secondary" className="px-2 py-0 text-[10px]">{course.level}</Badge>
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">{course.title}</h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {course.meta.students} · {course.meta.duration} · atualizado {course.meta.updated}
            </p>
          </div>
          <div className="hud-corners min-w-44 rounded-lg border border-border/70 bg-card/70 p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Progresso</span>
              <span className="font-mono text-sm font-bold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="mt-2 h-1.5" />
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">
              {course.xpEarned} / {course.xpTotal} XP
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {course.modules.map((m) => {
          const done = m.lessons.filter((l) => l.completed).length;
          const active = m.lessons.some((l) => !l.completed && !l.locked);
          return (
            <Card key={m.id} className={`hud-corners border-border/70 bg-card/70 ${active ? "border-primary/40" : ""}`}>
              <CardContent className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                      <Swords className="size-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{m.codename}</span>
                      <h2 className="font-display text-lg font-semibold text-foreground">{m.title}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{done}/{m.lessons.length} concluídas</span>
                    <span className="font-mono text-sm font-bold text-primary">+{m.xp} XP</span>
                  </div>
                </div>

                <p className="mb-4 flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                  <Target className="mt-0.5 size-4 shrink-0 text-accent" />
                  {m.mission}
                </p>

                <ul className="space-y-2">
                  {m.lessons.map((l) => {
                    const locked = l.locked;
                    return (
                      <li key={l.id}>
                        <Link
                          href={locked ? "#" : `/app/trilhas/sql-fundamentos/${l.id}`}
                          aria-disabled={locked}
                          className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors ${
                            locked
                              ? "cursor-not-allowed border-border/40 bg-muted/20 opacity-50"
                              : l.completed
                                ? "border-border/50 bg-muted/30 hover:border-primary/40"
                                : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                          }`}
                        >
                          <LessonBadge type={l.type} completed={l.completed} locked={locked} />
                          <span className="flex-1 truncate text-sm text-foreground">{l.title}</span>
                          <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                            <Clock className="size-3" /> {l.durationMin}min
                          </span>
                          <span className="font-mono text-xs font-bold text-primary">+{l.xp}</span>
                          {locked ? (
                            <Lock className="size-4 text-muted-foreground" />
                          ) : (
                            <Button asChild size="sm" variant={l.completed ? "outline" : "default"} className="gap-1.5">
                              <Link href={`/app/trilhas/sql-fundamentos/${l.id}`}>
                                {l.completed ? <>Rever</> : (
                                  <>
                                    <Play className="size-3.5" /> Iniciar
                                  </>
                                )}
                              </Link>
                            </Button>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function LessonBadge({ type, completed, locked }: { type: string; completed: boolean; locked?: boolean }) {
  const map = {
    video: { icon: Play, cls: "border-primary/40 bg-primary/10 text-primary", label: "Vídeo" },
    sandbox: { icon: Terminal, cls: "border-accent/40 bg-accent/10 text-accent", label: "Sandbox" },
    quiz: { icon: Brain, cls: "border-sky-400/40 bg-sky-400/10 text-sky-400", label: "Quiz" },
    project: { icon: Swords, cls: "border-amber-400/40 bg-amber-400/10 text-amber-400", label: "Projeto" },
    challenge: { icon: Trophy, cls: "border-amber-400/40 bg-amber-400/10 text-amber-400", label: "Desafio" },
  } as const;
  const m = map[type as keyof typeof map] ?? map.video;
  if (locked)
    return (
      <div className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-muted">
        <Lock className="size-4 text-muted-foreground" />
      </div>
    );
  if (completed)
    return (
      <div className="grid size-10 shrink-0 place-items-center rounded-md border border-accent/40 bg-accent/10">
        <CheckCircle2 className="size-4 text-accent" />
      </div>
    );
  return (
    <div className={`grid size-10 shrink-0 place-items-center rounded-md border ${m.cls}`}>
      <m.icon className="size-4" />
    </div>
  );
}

function Target(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}