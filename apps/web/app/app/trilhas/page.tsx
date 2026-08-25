"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Play, ChevronRight } from "lucide-react"
import { trailsApi } from "@/lib/api/service"

export default function TrilhasListPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await trailsApi.listCourses()
        setCourses(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando trilhas...</div>
  if (error) return <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Catálogo da Tropa</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Trilhas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Cursos publicados · progresso real salvo no servidor</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <Card key={c.id} className="hud-corners border-border/70 bg-card/70 hover:border-primary/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate font-display text-base">{c.title}</CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-0 text-[10px]">{c.level}</Badge>
                    <span className="font-mono text-[11px] text-muted-foreground">{c.lessonCount ?? (c.modules?.length ?? 0)} módulos · {c.xpTotal} XP</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2 text-sm text-muted-foreground">{c.description ?? "Trilha de formação"}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">/{c.slug}</span>
                <Button asChild size="sm" className="gap-1.5">
                  <Link href={`/app/trilhas/${c.slug}`}>
                    Abrir trilha <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && <p className="text-sm text-muted-foreground">Nenhum curso publicado ainda. Rode o seed na API.</p>}
    </div>
  )
}
