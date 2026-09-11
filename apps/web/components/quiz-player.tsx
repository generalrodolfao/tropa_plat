"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Brain, CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { quizzesApi } from "@/lib/api/service"

interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  difficulty?: number
  category?: string | null
}

interface Quiz {
  id: string
  mode: string
  passingScore: number
  timeLimitSec?: number | null
  xpAward: number
  maxAttempts: number
  questions: QuizQuestion[]
}

interface AttemptResult {
  attemptId: string
  score: number
  passed: boolean
  earnedXp: number
  totalQuestions: number
  correctAnswers: number
  details: Array<{
    questionId: string
    correct: boolean
    correctIndex: number
    explanation?: string
  }>
}

export function QuizPlayer({
  lessonId,
  onPassed,
}: {
  lessonId: string
  onPassed?: (result: AttemptResult) => void
}) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef<number>(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    quizzesApi
      .getByLesson(lessonId)
      .then((data: Quiz) => {
        if (!active) return
        setQuiz(data)
        startedRef.current = Date.now()
      })
      .catch(() => {
        if (active) setUnavailable(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [lessonId])

  const answeredCount = useMemo(
    () => (quiz ? quiz.questions.filter((q) => answers[q.id] !== undefined).length : 0),
    [quiz, answers],
  )

  async function submit() {
    if (!quiz) return
    if (answeredCount < quiz.questions.length) {
      setError("Responda todas as perguntas antes de enviar.")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const elapsed = Math.max(0, Date.now() - startedRef.current)
      const payload = quiz.questions.map((q) => ({
        questionId: q.id,
        chosenIndex: answers[q.id],
        timeMs: elapsed,
      }))
      const res: AttemptResult = await quizzesApi.submitAttempt(quiz.id, payload)
      setResult(res)
      if (res.passed) onPassed?.(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar suas respostas.")
    } finally {
      setSubmitting(false)
    }
  }

  function retry() {
    setResult(null)
    setAnswers({})
    setError(null)
    startedRef.current = Date.now()
  }

  if (loading) {
    return (
      <Card className="hud-corners border-border/70 bg-card/70">
        <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando quiz...
        </CardContent>
      </Card>
    )
  }

  if (unavailable || !quiz || quiz.questions.length === 0) {
    return (
      <Card className="hud-corners border-border/70 bg-card/70">
        <CardContent className="p-8 text-center">
          <Brain className="mx-auto size-10 text-sky-400" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum quiz cadastrado para esta missão. Use &ldquo;Concluir missão&rdquo; para avançar.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (result) {
    return (
      <Card className="hud-corners border-border/70 bg-card/70">
        <CardContent className="p-6">
          <div className="text-center">
            <div
              className={`mx-auto grid size-16 place-items-center rounded-full border ${result.passed ? "border-accent/50 bg-accent/10" : "border-destructive/50 bg-destructive/10"}`}
            >
              {result.passed ? (
                <CheckCircle2 className="size-8 text-accent" />
              ) : (
                <XCircle className="size-8 text-destructive" />
              )}
            </div>
            <h3 className="mt-3 font-display text-xl font-bold text-foreground">
              {result.passed ? "Missão aprovada!" : "Quase lá, soldado"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.correctAnswers}/{result.totalQuestions} corretas · nota {result.score}/100 (mínimo {quiz.passingScore})
              {result.passed && result.earnedXp > 0 ? ` · +${result.earnedXp} XP` : ""}
            </p>
            <Progress value={result.score} className="mx-auto mt-4 h-1.5 max-w-sm" />
          </div>

          <div className="mt-6 space-y-3">
            {quiz.questions.map((q) => {
              const detail = result.details.find((d) => d.questionId === q.id)
              const chosen = answers[q.id]
              return (
                <div key={q.id} className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start gap-2">
                    {detail?.correct ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{q.prompt}</div>
                      <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                        Sua resposta: {chosen !== undefined ? q.options[chosen] : "—"}
                        {!detail?.correct && detail && ` · correta: ${q.options[detail.correctIndex]}`}
                      </div>
                      {detail?.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground">{detail.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!result.passed && (
            <div className="mt-5 flex justify-center">
              <Button className="gap-2" onClick={retry} disabled={submitting}>
                <RefreshCw className="size-4" /> Tentar novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hud-corners border-border/70 bg-card/70">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="size-5 text-sky-400" />
            <span className="font-display text-base font-semibold text-foreground">Quiz de fixação</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {answeredCount}/{quiz.questions.length} respondidas
          </span>
        </div>

        <div className="space-y-5">
          {quiz.questions.map((q, i) => (
            <div key={q.id}>
              <div className="mb-2 text-sm font-medium text-foreground">
                {i + 1}. {q.prompt}
              </div>
              <div className="space-y-1.5">
                {q.options.map((opt, idx) => {
                  const selected = answers[q.id] === idx
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selected
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
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" /> {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between">
          <span className="font-mono text-[11px] text-muted-foreground">
            Nota mínima: {quiz.passingScore} · +{quiz.xpAward} XP se aprovado
          </span>
          <Button className="gap-1.5" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Enviar respostas
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
