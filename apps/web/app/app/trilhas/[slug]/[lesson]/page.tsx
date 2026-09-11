"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Swords, ChevronLeft, CheckCircle2, Captions, Clock, FileText, ChevronRight } from "lucide-react"
import { progressApi, trailsApi } from "@/lib/api/service"
import { VideoPlayer } from "@/components/video-player"
import { SandboxEditor } from "@/components/sandbox/sandbox-editor"
import { QuizPlayer } from "@/components/quiz-player"

export default function LessonPage() {
  const params = useParams<{ slug: string; lesson: string }>()
  const slug = params.slug as string
  const lessonId = params.lesson as string
  const [lesson, setLesson] = useState<any>(null)
  const [videoData, setVideoData] = useState<any>(null)
  const [transcript, setTranscript] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [xpAwarded, setXpAwarded] = useState<number | null>(null)
  const [activeTranscriptIdx, setActiveTranscriptIdx] = useState<number | null>(null)
  const [nextLesson, setNextLesson] = useState<any>(null)

  useEffect(() => {
    if (!lessonId) return
    ;(async () => {
      try {
        const data = await progressApi.getLesson(lessonId) as any
        setLesson(data)

        // Buscar vídeo se for tipo video
        if (data.type === "video") {
          // Primeiro verificar se tem URL no content
          const content = data.content as any
          if (content?.streamUrl) {
            // Usar URL do content diretamente
            setVideoData({
              status: "ready",
              hlsUrl: content.streamUrl,
              mp4Url: content.mp4Url || null,
              uid: content.videoUid || null
            })
          } else if (content?.videoUrl) {
            // Usar URL do content diretamente
            setVideoData({
              status: "ready",
              hlsUrl: content.videoUrl,
              mp4Url: null,
              uid: null
            })
          } else {
            // Tentar buscar da API
            try {
              const vidRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/video/lesson/${lessonId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
              )
              if (vidRes.ok) {
                const vid = await vidRes.json()
                setVideoData(vid)
                if (vid.transcript) setTranscript(vid.transcript)
              }
            } catch {}
          }
        }

        // Buscar próxima aula
        try {
          const course = await trailsApi.getCourse(data.module?.course?.slug) as any
          const allLessons = course.modules?.flatMap((m: any) => m.lessons ?? []) ?? []
          const currentIdx = allLessons.findIndex((l: any) => l.id === lessonId)
          if (currentIdx !== -1 && currentIdx < allLessons.length - 1) {
            setNextLesson(allLessons[currentIdx + 1])
          }
        } catch {}

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

  const handleVideoProgress = useCallback((seconds: number) => {
    // Atualizar transcrição ativa baseado no tempo
    if (transcript?.sentences) {
      const idx = transcript.sentences.findIndex(
        (s: any) => seconds >= s.start && seconds <= s.end
      )
      if (idx !== -1) setActiveTranscriptIdx(idx)
    }
  }, [transcript])

  const handleVideoEnded = useCallback(() => {
    // Auto-complete quando vídeo terminar
    onComplete()
  }, [])

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
  const content = lesson.content as any
  const hasVideo = (videoData?.status === "ready" && videoData?.hlsUrl) || 
                   (content?.streamUrl) || 
                   (content?.videoUrl)

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
          <LessonContent
            type={lesson.type}
            title={lesson.title}
            lessonId={lessonId}
            hasVideo={hasVideo}
            videoData={videoData}
            content={content}
            onProgress={handleVideoProgress}
            onEnded={handleVideoEnded}
            onQuizPassed={onComplete}
          />
          <div className="hud-corners flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 p-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Estado da missão</div>
              <div className="text-sm font-medium text-foreground">
                {completed ? `Concluída! +${xpAwarded ?? lesson.xpAward} XP creditado` : "Execute esta missão para ganhar XP e liberar a próxima"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {nextLesson && (
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link href={`/app/trilhas/${slug}/${nextLesson.id}`}>
                    Próxima aula <ChevronRight className="size-4" />
                  </Link>
                </Button>
              )}
              <Button size="lg" className="gap-2" onClick={onComplete} disabled={completing || completed}>
                {completed ? <><CheckCircle2 className="size-4" /> Concluída</> : completing ? "Salvando..." : <>Concluir missão <CheckCircle2 className="size-4" /></>}
              </Button>
            </div>
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

          {/* Transcrição clicável */}
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Captions className="size-3.5" /> Transcrição
              </div>
              {transcript?.sentences ? (
                <div className="max-h-[300px] space-y-1 overflow-y-auto">
                  {transcript.sentences.map((sentence: any, idx: number) => (
                    <button
                      key={idx}
                      className={`block w-full rounded px-2 py-1 text-left text-xs transition-colors ${
                        activeTranscriptIdx === idx
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                      onClick={() => {
                        const video = document.querySelector("video")
                        if (video) video.currentTime = sentence.start
                      }}
                    >
                      <Clock className="mr-1 inline size-3" />
                      {sentence.text}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {transcript?.text ?? "Transcrição disponível após processamento do vídeo (Cloudflare Stream)."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function LessonContent({ type, title, lessonId, hasVideo, videoData, content, onProgress, onEnded, onQuizPassed }: {
  type: string
  title: string
  lessonId: string
  hasVideo?: boolean
  videoData?: any
  content?: any
  onProgress?: (seconds: number) => void
  onEnded?: () => void
  onQuizPassed?: () => void
}) {
  if (type === "sandbox") {
    return (
      <SandboxEditor
        engine={content?.engine === "python" ? "python" : "sql"}
        datasetUrl={content?.datasetUrl}
        datasetName={content?.datasetName}
      />
    )
  }
  if (type === "quiz") return <QuizPlayer lessonId={lessonId} onPassed={() => onQuizPassed?.()} />
  if (type === "project") return <ProjectCallout />
  if (type === "article") return <ArticleContent title={title} content={content} />

  // Video lesson - check for video URL from multiple sources
  const videoUrl = videoData?.hlsUrl || content?.streamUrl || content?.videoUrl
  const mp4Url = videoData?.mp4Url || content?.mp4Url
  
  if (hasVideo && videoUrl) {
    return (
      <div className="space-y-4">
        <VideoPlayer
          hlsUrl={videoUrl}
          mp4Url={mp4Url}
          title={title}
          onProgress={onProgress}
          onEnded={onEnded}
        />
        <CardContent className="rounded-xl border border-border/70 bg-card/70 p-5">
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Assista ao vídeo completo. O progresso é salvo automaticamente. Ao finalizar, clique em &ldquo;Concluir missão&rdquo; para ganhar XP.
          </p>
        </CardContent>
      </div>
    )
  }

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
        <p className="text-sm leading-relaxed text-muted-foreground">
          Vídeo ainda não disponível. Faça upload do vídeo no painel admin para habilitar o player.
        </p>
      </CardContent>
    </Card>
  )
}

function ProjectCallout() {
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <CardContent className="p-8 text-center">
        <Swords className="mx-auto size-10 text-amber-400" />
        <p className="mt-3 text-sm text-muted-foreground">
          Esta missão é um projeto prático com correção. Envie sua entrega na área de Projetos.
        </p>
        <Button asChild className="mt-4 gap-2">
          <Link href="/app/projetos">
            Ir para Projetos <ChevronRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function ArticleContent({ title, content }: { title: string; content?: any }) {
  const body: string = content?.body ?? content?.text ?? content?.markdown ?? ""
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="font-display text-lg font-semibold text-foreground">{title}</span>
        </div>
        {body ? (
          <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
            {body}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Conteúdo do artigo ainda não cadastrado.</p>
        )}
      </CardContent>
    </Card>
  )
}
