"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Trophy, Target, ChevronRight, Play, Terminal, Brain, Swords, CheckCircle2, Clock } from "lucide-react"
import { trailsApi, progressApi, gamificationApi } from "@/lib/api/service"
import { OFENSIVA_DO_DIA } from "@/lib/mock-data"

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [courseProgress, setCourseProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [s, courses] = await Promise.allSettled([gamificationApi.getSummary(), trailsApi.listCourses()])
        if (s.status === "fulfilled") setSummary(s.value)
        if (courses.status === "fulfilled" && courses.value[0]) {
          const c = courses.value[0]
          // busca detalhe completo para módulos
          try {
            const detail = await trailsApi.getCourse(c.slug)
            setCourse(detail)
            const prog = await progressApi.getCourseProgress(detail.id)
            setCourseProgress(prog)
          } catch {
            setCourse(c)
          }
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando painel...</div>

  const rank = summary?.rank ?? "Recruta"
  const nextRank = summary?.nextRank ?? "Soldado"
  const rankProgress = summary?.rankProgress ?? 0
  const nextLesson = course?.modules
    ?.flatMap((m: any) => m.lessons)
    ?.find((l: any) => !(courseProgress?.completedIds ?? []).includes(l.id))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">BEM-VINDO DE VOLTA, SOLDADO</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Pronto para a ofensiva de hoje?</h1>
        </div>
        <div className="hud-corners flex items-center gap-4 rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Patente</div>
            <div className="font-display text-sm font-bold text-foreground">{rank}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{summary?.totalXp ?? 0} XP</div>
          </div>
          <Progress value={rankProgress} className="w-28" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Próx</div>
            <div className="text-sm font-semibold text-accent">{nextRank}</div>
          </div>
        </div>
      </div>

      <section className="hud-corners rounded-xl border border-border/70 bg-card/70 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Ofensiva do dia</h2>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">+275 XP se completar</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OFENSIVA_DO_DIA.map((t) => (
            <div key={t.id} className="flex flex-col rounded-lg border border-border/60 bg-muted/30 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">{t.type}</span>
                <span className="font-mono text-xs font-bold text-primary">+{t.xp} XP</span>
              </div>
              <div className="text-sm font-medium text-foreground">{t.title}</div>
              <div className="mt-1 flex-1 text-xs text-muted-foreground">{t.detail}</div>
              <Button asChild size="sm" variant="ghost" className="mt-3 gap-1 px-2 text-primary">
                <Link href={course ? `/app/trilhas/${course.slug}` : "/app/trilhas"}>
                  Começar <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {course ? (
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                  <Play className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-base font-semibold">{course.title}</CardTitle>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{course.slug}</span>
                    <Badge variant="secondary" className="px-2 py-0 text-[10px]">{course.level}</Badge>
                  </div>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-primary">
                {courseProgress?.earnedXp ?? 0}/{courseProgress?.totalXp ?? course.xpTotal} XP
              </span>
            </CardHeader>
            <CardContent className="space-y-5">
              <Progress value={courseProgress?.progressPct ?? 0} className="h-1.5" />
              {course.modules?.slice(0, 2).map((m: any) => {
                const lessons = m.lessons ?? []
                const done = lessons.filter((l: any) => (courseProgress?.completedIds ?? []).includes(l.id)).length
                return (
                  <div key={m.id}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{m.codename}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{done}/{lessons.length}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {lessons.slice(0, 3).map((l: any) => {
                        const completed = (courseProgress?.completedIds ?? []).includes(l.id)
                        return (
                          <li key={l.id}>
                            <Link
                              href={`/app/trilhas/${course.slug}/${l.id}`}
                              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${completed ? "border-border/50 bg-muted/30" : "border-primary/40 bg-primary/5 hover:bg-primary/10"}`}
                            >
                              <span className="flex-1 truncate text-foreground">{l.title}</span>
                              <span className="font-mono text-xs font-bold text-primary">+{l.xpAward} XP</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
              {nextLesson && (
                <div className="hud-corners flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 p-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Próxima missão</span>
                    <div className="text-sm font-medium text-foreground">{nextLesson.title}</div>
                  </div>
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href={`/app/trilhas/${course.slug}/${nextLesson.id}`}>
                      <Play className="size-3.5" /> Iniciar
                    </Link>
                  </Button>
                </div>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href={`/app/trilhas/${course.slug}`}>Ver trilha completa</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-8 text-sm text-muted-foreground">Nenhuma trilha publicada. Ver <Link href="/app/trilhas" className="text-primary underline">/app/trilhas</Link></Card>
        )}

        <div className="space-y-6">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
                <Flame className="size-4 text-primary" /> Streak
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-primary">{summary?.streak ?? 0}</div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">dias</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>Recorde</span>
                  <span className="text-foreground">{summary?.longestStreak ?? 0} dias</span>
                </div>
                <Progress value={Math.min(100, (summary?.streak ?? 0) * 4)} className="h-1" />
                <p className="font-mono text-[11px] text-muted-foreground">XP total: {summary?.totalXp ?? 0} · Semana: {summary?.weekXp ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hud-corners border-border/70 bg-card/70 p-6 text-center">
            <Trophy className="mx-auto size-8 text-primary" />
            <p className="mt-2 text-sm font-medium">Batalhão Bravo</p>
            <p className="font-mono text-xs text-muted-foreground">Liga semanal — dados reais em /v1/leagues/current</p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/app/ligas">Ver liga</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
