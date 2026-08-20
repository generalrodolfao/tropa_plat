import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Flame,
  Trophy,
  Target,
  ChevronRight,
  Play,
  Terminal,
  Brain,
  Swords,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { COURSES, OFENSIVA_DO_DIA, LEAGUE, currentRank } from "@/lib/mock-data";

const XP_TOTAL = 1240;

export default function DashboardPage() {
  const { current, next, progress } = currentRank(XP_TOTAL);
  const course = COURSES[0];
  const nextLesson = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => !l.completed && !l.locked);

  return (
    <div className="space-y-6">
      <HeaderRow current={current.title} next={next.title} progress={progress} />
      <OfensivaDoDia />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <TrilhaEmAndamento course={course} nextLesson={nextLesson} />
        <div className="space-y-6">
          <LigaCard />
          <MinistreCard />
        </div>
      </div>
    </div>
  );
}

function HeaderRow({ current, next, progress }: { current: string; next: string; progress: number }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          BEM-VINDO DE VOLTA, SOLDADO
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
          Pronto para a ofensiva de hoje?
        </h1>
      </div>
      <div className="hud-corners flex items-center gap-4 rounded-lg border border-border/70 bg-card/70 px-4 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Patente</div>
          <div className="font-display text-sm font-bold text-foreground">{current}</div>
        </div>
        <Progress value={progress} className="w-28" />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Próx</div>
          <div className="text-sm font-semibold text-accent">{next}</div>
        </div>
      </div>
    </div>
  );
}

function OfensivaDoDia() {
  const typeMeta = {
    assistir: { icon: Play, label: "ASSISTIR", className: "border-primary/40 bg-primary/10 text-primary" },
    praticar: { icon: Terminal, label: "PRATICAR", className: "border-accent/40 bg-accent/10 text-accent" },
    revisar: { icon: Brain, label: "REVISAR", className: "border-sky-400/40 bg-sky-400/10 text-sky-400" },
    hackathon: { icon: Trophy, label: "HACKATHON", className: "border-amber-400/40 bg-amber-400/10 text-amber-400" },
  } as const;

  return (
    <section className="hud-corners rounded-xl border border-border/70 bg-card/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">Ofensiva do dia</h2>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">~48 MIN · +275 XP</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {OFENSIVA_DO_DIA.map((t) => {
          const meta = typeMeta[t.type];
          return (
            <div
              key={t.id}
              className="group flex flex-col rounded-lg border border-border/60 bg-muted/30 p-3.5 transition-colors hover:border-primary/40"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${meta.className}`}>
                  <meta.icon className="size-3" />
                  {meta.label}
                </span>
                <span className="font-mono text-xs font-bold text-primary">+{t.xp} XP</span>
              </div>
              <div className="text-sm font-medium text-foreground">{t.title}</div>
              <div className="mt-1 flex-1 text-xs text-muted-foreground">{t.detail}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Clock className="size-3" /> {t.minutes} min
                </span>
                <Button asChild size="sm" variant="ghost" className="gap-1 px-2 text-primary">
                  <Link href="/app/trilhas/sql-fundamentos">
                    Começar <ChevronRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TrilhaEmAndamento({ course, nextLesson }: { course: (typeof COURSES)[0]; nextLesson?: (typeof COURSES)[0]["modules"][0]["lessons"][0] }) {
  const pct = Math.round((course.xpEarned / course.xpTotal) * 100);

  return (
    <Card className="hud-corners border-border/70 bg-card/70">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg border border-primary/30 bg-primary/10">
            <Play className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-base font-semibold">{course.title}</CardTitle>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{course.codename}</span>
              <Badge variant="secondary" className="px-2 py-0 text-[10px]">{course.level}</Badge>
            </div>
          </div>
        </div>
        <span className="font-mono text-sm font-bold text-primary">
          {course.xpEarned}/{course.xpTotal} XP
        </span>
      </CardHeader>

      <CardContent className="space-y-5">
        <Progress value={pct} className="h-1.5" />

        {course.modules.map((m) => {
          const done = m.lessons.filter((l) => l.completed).length;
          return (
            <div key={m.id}>
              <div className="mb-2 flex items-baseline justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{m.codename}</span>
                  <h3 className="font-display text-sm font-semibold text-foreground">{m.title}</h3>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {done}/{m.lessons.length}
                </span>
              </div>
              <ul className="space-y-1.5">
                {m.lessons.map((l) => {
                  const locked = l.locked;
                  return (
                    <li key={l.id}>
                      <Link
                        href={locked ? "#" : `/app/trilhas/sql-fundamentos/${l.id}`}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          locked
                            ? "cursor-not-allowed border-border/40 bg-muted/20 opacity-50"
                            : l.completed
                              ? "border-border/50 bg-muted/30 hover:border-primary/40"
                              : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                        }`}
                        aria-disabled={locked}
                      >
                        <LessonIcon type={l.type} completed={l.completed} locked={locked} />
                        <span className="flex-1 truncate text-foreground">{l.title}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{l.durationMin}min</span>
                        <span className="font-mono text-xs font-bold text-primary">+{l.xp}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {nextLesson && (
          <div className="hud-corners flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 p-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Próxima missão</span>
              <div className="text-sm font-medium text-foreground">{nextLesson.title}</div>
            </div>
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/app/trilhas/sql-fundamentos/${nextLesson.id}`}>
                <Play className="size-3.5" /> Iniciar
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LessonIcon({ type, completed, locked }: { type: string; completed: boolean; locked?: boolean }) {
  const size = "size-9";
  if (locked)
    return (
      <div className={`grid ${size} shrink-0 place-items-center rounded-md border border-border bg-muted font-mono text-xs text-muted-foreground`}>
        🔒
      </div>
    );
  if (completed)
    return (
      <div className={`grid ${size} shrink-0 place-items-center rounded-md border border-accent/40 bg-accent/10`}>
        <CheckCircle2 className="size-4 text-accent" />
      </div>
    );
  const map = {
    video: { icon: Play, cls: "border-primary/40 bg-primary/10 text-primary" },
    sandbox: { icon: Terminal, cls: "border-accent/40 bg-accent/10 text-accent" },
    quiz: { icon: Brain, cls: "border-sky-400/40 bg-sky-400/10 text-sky-400" },
    project: { icon: Swords, cls: "border-amber-400/40 bg-amber-400/10 text-amber-400" },
    challenge: { icon: Trophy, cls: "border-amber-400/40 bg-amber-400/10 text-amber-400" },
  } as const;
  const m = map[type as keyof typeof map] ?? map.video;
  return (
    <div className={`grid ${size} shrink-0 place-items-center rounded-md border ${m.cls}`}>
      <m.icon className="size-4" />
    </div>
  );
}

function LigaCard() {
  const you = LEAGUE.members.find((m) => m.you);
  return (
    <Card className="hud-corners border-border/70 bg-card/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
            <Swords className="size-4 text-primary" />
            {LEAGUE.name}
          </CardTitle>
          <Link href="/app/ligas" className="font-mono text-[11px] text-primary hover:underline">
            Ver liga
          </Link>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">{LEAGUE.week}</p>
      </CardHeader>
      <CardContent className="space-y-1">
        {LEAGUE.members.slice(0, 5).map((m) => (
          <div
            key={m.rank}
            className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm ${m.you ? "border border-primary/40 bg-primary/10" : ""}`}
          >
            <span className="w-6 text-center font-mono text-xs text-muted-foreground">{m.rank}º</span>
            <span className={`flex-1 truncate ${m.you ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {m.name}
            </span>
            {m.movement === "up" && <ArrowUpRight className="size-3.5 text-accent" />}
            {m.movement === "down" && <ArrowDownRight className="size-3.5 text-destructive" />}
            {m.movement === "same" && <Minus className="size-3.5 text-muted-foreground" />}
            <span className="font-mono text-xs font-bold text-primary">{m.xp.toLocaleString("pt-BR")}</span>
          </div>
        ))}
        {you && (
          <p className="pt-2 text-center font-mono text-[11px] text-muted-foreground">
            Você está na posição <span className="font-bold text-accent">{you.rank}º</span> — top 15% sobe de liga
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MinistreCard() {
  return (
    <Card className="hud-corners border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
          <Flame className="size-4 text-primary" />
          Fogo cruzado — streak
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="text-center">
          <div className="font-mono text-4xl font-bold text-primary">12</div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">dias</div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>Recorde pessoal</span>
            <span className="text-foreground">23 dias</span>
          </div>
          <Progress value={52} className="h-1" />
          <p className="font-mono text-[11px] text-muted-foreground">
            2 escudos de freeze restantes este trimestre
          </p>
        </div>
      </CardContent>
    </Card>
  );
}