"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Terminal, Brain, Swords, Trophy, CheckCircle2, Clock, ChevronLeft, Lock } from "lucide-react"
import { trailsApi, progressApi } from "@/lib/api/service"

export default function TrilhaPage() {
  const { slug } = useParams<{ slug: string }>()
  const [course, setCourse] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      try {
        const c = await trailsApi.getCourse(slug as string)
        setCourse(c)
        try {
          const p = await progressApi.getCourseProgress(c.id)
          setProgress(p)
        } catch {}
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando trilha...</div>
  if (error) return <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
  if (!course) return <div className="p-8 text-sm">Trilha não encontrada</div>

  const completedIds = new Set(progress?.completedIds ?? [])
  const pct = progress?.progressPct ?? 0

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1.5 text-muted-foreground">
          <Link href="/app/trilhas">
            <ChevronLeft className="size-4" /> Trilhas
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-primary">{course.modules?.[0]?.codename ?? "TRILHA"}</span>
              <Badge variant="secondary" className="px-2 py-0 text-[10px]">{course.level}</Badge>
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">{course.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{course.modules?.length ?? 0} módulos · {course.xpTotal} XP total</p>
          </div>
          <div className="hud-corners min-w-44 rounded-lg border border-border/70 bg-card/70 p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Progresso</span>
              <span className="font-mono text-sm font-bold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="mt-2 h-1.5" />
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">
              {progress?.completedLessons ?? 0} / {progress?.totalLessons ?? 0} aulas · {progress?.earnedXp ?? 0} / {progress?.totalXp ?? course.xpTotal} XP
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {course.modules?.map((m: any) => {
          const lessons = m.lessons ?? []
          const done = lessons.filter((l: any) => completedIds.has(l.id)).length
          const active = lessons.some((l: any) => !completedIds.has(l.id))
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
                    <span className="font-mono text-xs text-muted-foreground">{done}/{lessons.length} concluídas</span>
                    <span className="font-mono text-sm font-bold text-primary">+{m.xpAward} XP</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {lessons.map((l: any) => {
                    const completed = completedIds.has(l.id)
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/app/trilhas/${course.slug}/${l.id}`}
                          className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors ${
                            completed ? "border-border/50 bg-muted/30 hover:border-primary/40" : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                          }`}
                        >
                          <LessonBadge type={l.type} completed={completed} />
                          <span className="flex-1 truncate text-sm text-foreground">{l.title}</span>
                          <span className="font-mono text-xs font-bold text-primary">+{l.xpAward} XP</span>
                          <Button asChild size="sm" variant={completed ? "outline" : "default"} className="gap-1.5">
                            <span>{completed ? "Rever" : <><Play className="size-3.5" /> Iniciar</>}</span>
                          </Button>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function LessonBadge({ type, completed }: { type: string; completed: boolean }) {
  const map: any = {
    video: { icon: Play, cls: "border-primary/40 bg-primary/10 text-primary" },
    sandbox: { icon: Terminal, cls: "border-accent/40 bg-accent/10 text-accent" },
    quiz: { icon: Brain, cls: "border-sky-400/40 bg-sky-400/10 text-sky-400" },
    project: { icon: Swords, cls: "border-amber-400/40 bg-amber-400/10 text-amber-400" },
    challenge: { icon: Trophy, cls: "border-amber-400/40 bg-amber-400/10 text-amber-400" },
    article: { icon: Play, cls: "border-primary/40 bg-primary/10 text-primary" },
  }
  const m = map[type] ?? map.video
  if (completed)
    return (
      <div className="grid size-10 shrink-0 place-items-center rounded-md border border-accent/40 bg-accent/10">
        <CheckCircle2 className="size-4 text-accent" />
      </div>
    )
  return (
    <div className={`grid size-10 shrink-0 place-items-center rounded-md border ${m.cls}`}>
      <m.icon className="size-4" />
    </div>
  )
}
