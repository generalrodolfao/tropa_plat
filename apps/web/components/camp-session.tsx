"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Flame,
  Loader2,
  RotateCcw,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react"
import { campsApi } from "@/lib/api/service"
import type {
  CampAnswerResult,
  CampQuestionItem,
  CampSessionResult,
  CampSessionStart,
} from "@/lib/api/client"

const FORMAT_LABEL: Record<string, string> = {
  quiz: "Quiz",
  exercise: "Exercício",
  interview: "Entrevista",
  requirements: "Requisitos",
  hotseat: "Hotseat",
}

const HOTSEAT_SECONDS = 45

export function CampSessionRunner({
  session,
  onExit,
  onRestart,
}: {
  session: CampSessionStart
  onExit: () => void
  onRestart: () => void
}) {
  const items = session.items
  const isHotseat = session.mode === "hotseat" || session.format === "hotseat"

  const [index, setIndex] = useState(0)
  const [text, setText] = useState("")
  const [choice, setChoice] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<CampAnswerResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [result, setResult] = useState<CampSessionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(HOTSEAT_SECONDS)
  const itemStartRef = useRef<number>(Date.now())
  const submittingRef = useRef(false)

  const current: CampQuestionItem | undefined = items[index]

  useEffect(() => {
    itemStartRef.current = Date.now()
    setRemaining(HOTSEAT_SECONDS)
    setFeedback(null)
    setText("")
    setChoice(null)
    setError(null)
  }, [index])

  useEffect(() => {
    if (!isHotseat || feedback || result || finishing) return
    if (remaining <= 0) {
      void handleSubmit(true)
      return
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, isHotseat, feedback, result, finishing])

  async function handleSubmit(fromTimeout = false) {
    if (!current || feedback || submittingRef.current) return
    if (current.format === "quiz") {
      if (choice === null && !fromTimeout) {
        setError("Escolha uma alternativa.")
        return
      }
    } else if (text.trim().length === 0 && !fromTimeout) {
      setError("Escreva sua resposta antes de enviar.")
      return
    }

    setError(null)
    submittingRef.current = true
    setSubmitting(true)
    try {
      const timeMs = Date.now() - itemStartRef.current
      const res = await campsApi.answer(session.sessionId, {
        itemIndex: current.index,
        chosenIndex: current.format === "quiz" ? (choice ?? undefined) : undefined,
        text: current.format === "quiz" ? undefined : text,
        timeMs,
      })
      setFeedback(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a resposta.")
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  async function handleNext() {
    if (index + 1 < items.length) {
      setIndex(index + 1)
      return
    }
    setFinishing(true)
    try {
      const res = await campsApi.finish(session.sessionId)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível finalizar a sessão.")
    } finally {
      setFinishing(false)
    }
  }

  if (result) {
    return (
      <Card className="hud-corners border-border/70 bg-card/70">
        <CardContent className="p-6">
          <div className="text-center">
            <div
              className={`mx-auto grid size-16 place-items-center rounded-full border ${
                result.passed
                  ? "border-accent/50 bg-accent/10"
                  : "border-primary/40 bg-primary/10"
              }`}
            >
              <Trophy
                className={`size-8 ${result.passed ? "text-accent" : "text-primary"}`}
              />
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold text-foreground">
              {result.summary?.headline ?? (result.passed ? "Boa, soldado!" : "Sessão concluída")}
            </h3>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {result.answered}/{result.totalItems} itens · nota {result.score}/100
              {result.earnedXp > 0 ? ` · +${result.earnedXp} XP` : ""}
            </p>
            <Progress value={result.score} className="mx-auto mt-4 h-1.5 max-w-sm" />
          </div>

          {result.summary?.summary && (
            <p className="mx-auto mt-5 max-w-2xl text-center text-sm text-muted-foreground">
              {result.summary.summary}
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {result.summary?.strengths?.length > 0 && (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                <h4 className="font-display text-sm font-semibold text-accent">Pontos fortes</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {result.summary.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.summary?.improvements?.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <h4 className="font-display text-sm font-semibold text-foreground">
                  A treinar
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {result.summary.improvements.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button className="gap-1.5" onClick={onRestart}>
              <RotateCcw className="size-4" /> Novo treino
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={onExit}>
              <ArrowLeft className="size-4" /> Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!current) {
    return (
      <Card className="border-border/70 bg-card/70">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Sessão sem itens. <button className="text-primary underline" onClick={onExit}>Voltar</button>
        </CardContent>
      </Card>
    )
  }

  const answeredCount = index + (feedback ? 1 : 0)
  const progress = Math.round((answeredCount / items.length) * 100)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onExit}>
            <ArrowLeft className="size-4" /> Sair
          </Button>
          <span className="font-mono text-[11px] text-muted-foreground">
            Item {index + 1}/{items.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {FORMAT_LABEL[current.format] ?? current.format}
          </Badge>
          {isHotseat && !feedback && (
            <Badge
              variant="outline"
              className={`gap-1 font-mono text-[10px] ${
                remaining <= 10 ? "border-destructive/50 text-destructive" : ""
              }`}
            >
              <Timer className="size-3" /> {remaining}s
            </Badge>
          )}
        </div>
      </div>

      <Progress value={progress} className="h-1.5" />

      <Card className="hud-corners border-border/70 bg-card/70">
        <CardContent className="p-6">
          <div className="flex items-start gap-2">
            <Flame className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-base font-medium text-foreground">{current.prompt}</p>
          </div>

          <div className="mt-5">
            {current.format === "quiz" ? (
              <div className="space-y-1.5">
                {(current.options ?? []).map((opt, idx) => {
                  const selected = choice === idx
                  const reveal = feedback
                  const isCorrect = feedback?.correctIndex === idx
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!!feedback}
                      onClick={() => setChoice(idx)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        reveal && isCorrect
                          ? "border-accent/60 bg-accent/10 text-foreground"
                          : reveal && selected
                            ? "border-destructive/60 bg-destructive/10 text-foreground"
                            : selected
                              ? "border-primary/50 bg-primary/10 text-foreground"
                              : "border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${
                          selected ? "border-primary bg-primary text-background" : "border-border"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            ) : (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!!feedback}
                placeholder={
                  current.format === "exercise"
                    ? "Escreva sua solução..."
                    : "Responda como se estivesse ao vivo..."
                }
                className="min-h-32"
              />
            )}
          </div>

          {feedback && (
            <div
              className={`mt-5 rounded-lg border p-4 ${
                feedback.correct
                  ? "border-accent/40 bg-accent/5"
                  : "border-destructive/40 bg-destructive/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.correct ? (
                  <CheckCircle2 className="size-4 text-accent" />
                ) : (
                  <XCircle className="size-4 text-destructive" />
                )}
                <span className="text-sm font-semibold text-foreground">
                  {feedback.correct ? "Boa!" : "Ajuste os pontos abaixo"}
                </span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {feedback.score}/100
                </span>
              </div>
              {feedback.feedback && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {feedback.feedback}
                </p>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          <div className="mt-5 flex justify-end">
            {feedback ? (
              <Button className="gap-1.5" onClick={handleNext} disabled={finishing}>
                {finishing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : index + 1 < items.length ? (
                  <>
                    Próximo <ChevronRight className="size-4" />
                  </>
                ) : (
                  <>
                    Ver resultado <Trophy className="size-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="gap-1.5"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="size-4" /> Enviar resposta
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
