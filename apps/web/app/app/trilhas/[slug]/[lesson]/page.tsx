"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Terminal, Brain, Swords, ChevronLeft, CheckCircle2, Bookmark, Captions } from "lucide-react"
import { progressApi } from "@/lib/api/service"

export default function LessonPage() {
  const params = useParams<{ slug: string; lesson: string }>()
  const slug = params.slug as string
  const lessonId = params.lesson as string
  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [xpAwarded, setXpAwarded] = useState<number | null>(null)

  useEffect(() => {
    if (!lessonId) return
    ;(async () => {
      try {
        const data = await progressApi.getLesson(lessonId)
        setLesson(data)
        // marca started
        try {
          await progressApi.start(lessonId)
        } catch {}
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [lessonId])

  async function onComplete() {
    setCompleting(true)
    try {
      const res = await progressApi.complete(lessonId)
      setCompleted(true)
      setXpAwarded(res.xpAwarded)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCompleting(false)
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando missão...</div>
  if (error) return <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
  if (!lesson) return <div className="p-8 text-sm">Aula não encontrada</div>

  const course = lesson.module?.course

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link href={`/app/trilhas/${slug}`}>
            <ChevronLeft className="size-4" /> {course?.title ?? "Trilha"}
          </Link>
        </Button>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>{lesson.module?.title}</span>
          <span className="text-border">·</span>
          <Badge variant="secondary" className="px-2 py-0 text-[10px]">+{lesson.xpAward} XP</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <LessonContent type={lesson.type} title={lesson.title} />
          <div className="hud-corners flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 p-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Estado da missão</div>
              <div className="text-sm font-medium text-foreground">
                {completed ? `Concluída! +${xpAwarded ?? lesson.xpAward} XP creditado` : "Execute esta missão para ganhar XP e liberar a próxima"}
              </div>
            </div>
            <Button size="lg" className="gap-2" onClick={onComplete} disabled={completing || completed}>
              {completed ? <><CheckCircle2 className="size-4" /> Concluída</> : completing ? "Salvando..." : <>Concluir missão <CheckCircle2 className="size-4" /></>}
            </Button>
          </div>
          {completed && (
            <p className="text-center font-mono text-xs text-accent">XP creditado de forma idempotente (unique_key lesson-{lessonId})</p>
          )}
        </div>

        <div className="space-y-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Detalhes</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span className="font-mono text-foreground">{lesson.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">XP</span><span className="font-bold text-primary">{lesson.xpAward}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Duração</span><span>{Math.ceil((lesson.durationSec ?? 0)/60)} min</span></div>
              </div>
            </CardContent>
          </Card>
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Captions className="size-3.5" /> Transcrição
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{lesson.content?.transcript ?? "Transcrição disponível após processamento do vídeo (Cloudflare Stream)."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function LessonContent({ type, title }: { type: string; title: string }) {
  if (type === "sandbox") return <SandboxMock title={title} />
  if (type === "quiz") return <QuizMock />
  if (type === "project") return <ProjectMock />
  return <VideoMock title={title} />
}

function VideoMock({ title }: { title: string }) {
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <div className="relative aspect-video grid-bg bg-muted/40">
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="grid size-20 place-items-center rounded-full border border-primary/50 bg-primary/15 shadow-[0_0_60px_-10px] shadow-primary/50">
              <Play className="size-9 fill-primary text-primary" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold text-foreground">{title}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">Cloudflare Stream · HLS · progresso salvo a cada 10s</div>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">Assista e clique em “Concluir missão” ao final — o XP é creditado via <span className="font-mono text-primary">POST /v1/progress/complete</span> com idempotência.</p>
      </CardContent>
    </Card>
  )
}

function SandboxMock({ title }: { title: string }) {
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-accent" />
          <span className="font-mono text-xs font-semibold text-foreground">{title} — DuckDB-WASM</span>
        </div>
        <Badge variant="secondary" className="px-2 py-0 font-mono text-[10px]">roda no navegador</Badge>
      </div>
      <CardContent className="p-5 font-mono text-sm">
        <p className="text-muted-foreground">Sandbox no browser — datasets via R2/CDN, execução WASM. Na entrega real, o botão “Concluir” valida via servidor (hidden tests).</p>
        <div className="mt-4 rounded-lg border border-border/60 bg-background/60 p-3">
          <pre className="overflow-x-auto text-xs">SELECT * FROM vendas WHERE estado = 'SP' LIMIT 5;</pre>
        </div>
      </CardContent>
    </Card>
  )
}

function QuizMock() {
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <CardContent className="p-8 text-center">
        <Brain className="mx-auto size-10 text-sky-400" />
        <p className="mt-3 text-sm text-muted-foreground">Quiz adaptativo (IRT) — em implementação. Por enquanto use “Concluir missão” para simular aprovação e ganhar XP.</p>
      </CardContent>
    </Card>
  )
}

function ProjectMock() {
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <CardContent className="p-8 text-center">
        <Swords className="mx-auto size-10 text-amber-400" />
        <p className="mt-3 text-sm text-muted-foreground">Projeto com correção auto/mentor — submissão via R2 + grading.</p>
        <Button className="mt-4 gap-2"><Bookmark className="size-4" /> Submeter projeto</Button>
      </CardContent>
    </Card>
  )
}
