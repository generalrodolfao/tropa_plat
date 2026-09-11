"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Brain, Plus, Trash2, Loader2, AlertTriangle, ChevronRight } from "lucide-react"
import { quizzesApi, trailsApi } from "@/lib/api/service"

interface QuizRow {
  id: string
  lessonId: string
  passingScore: number
  xpAward: number
  maxAttempts: number
  lesson: { id: string; title: string }
  _count: { questions: number; attempts: number }
}

interface LessonOption {
  id: string
  title: string
  course: string
}

interface Question {
  id: string
  prompt: string
  options: string[]
  difficulty: number
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([])
  const [lessons, setLessons] = useState<LessonOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)

  const [newQuiz, setNewQuiz] = useState({ lessonId: "", passingScore: 60, xpAward: 100 })
  const [managing, setManaging] = useState<QuizRow | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState({ prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" })

  const load = useCallback(async () => {
    try {
      const [q, courses] = await Promise.allSettled([quizzesApi.adminList(), trailsApi.listCourses()])
      if (q.status === "fulfilled") setQuizzes(q.value.items ?? [])
      if (courses.status === "fulfilled") {
        const opts = courses.value.flatMap((c: any) =>
          (c.modules ?? []).flatMap((m: any) =>
            (m.lessons ?? []).map((l: any) => ({ id: l.id, title: l.title, course: c.title })),
          ),
        )
        setLessons(opts)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const usedLessonIds = useMemo(() => new Set(quizzes.map((q) => q.lessonId)), [quizzes])
  const availableLessons = useMemo(() => lessons.filter((l) => !usedLessonIds.has(l.id)), [lessons, usedLessonIds])

  async function createQuiz() {
    if (!newQuiz.lessonId) {
      setError("Selecione uma aula.")
      return
    }
    setError(null)
    setAction("create")
    try {
      await quizzesApi.createQuiz({
        lessonId: newQuiz.lessonId,
        passingScore: Number(newQuiz.passingScore),
        xpAward: Number(newQuiz.xpAward),
      })
      setNewQuiz({ lessonId: "", passingScore: 60, xpAward: 100 })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar o quiz.")
    } finally {
      setAction(null)
    }
  }

  async function openManage(quiz: QuizRow) {
    setManaging(quiz)
    setQuestions([])
    setAction(`load-${quiz.id}`)
    try {
      const data = await quizzesApi.getByLesson(quiz.lessonId)
      setQuestions(data.questions ?? [])
    } catch {
      setQuestions([])
    } finally {
      setAction(null)
    }
  }

  async function addQuestion() {
    if (!managing) return
    const filled = newQuestion.options.filter((o) => o.trim())
    if (!newQuestion.prompt.trim() || filled.length < 2) {
      setError("Preencha o enunciado e ao menos 2 opções.")
      return
    }
    setError(null)
    setAction("question")
    try {
      await quizzesApi.addQuestion(managing.id, {
        prompt: newQuestion.prompt,
        options: newQuestion.options.map((o) => o.trim()),
        correctIndex: Number(newQuestion.correctIndex),
        explanation: newQuestion.explanation || undefined,
        difficulty: 2,
      })
      const data = await quizzesApi.getByLesson(managing.lessonId)
      setQuestions(data.questions ?? [])
      setNewQuestion({ prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível adicionar a pergunta.")
    } finally {
      setAction(null)
    }
  }

  async function removeQuestion(questionId: string) {
    if (!managing) return
    setAction(questionId)
    try {
      await quizzesApi.deleteQuestion(questionId)
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
      await load()
    } catch {
      // ignore
    } finally {
      setAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Conteúdo</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Quizzes</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{quizzes.length} quizzes cadastrados</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" /> {error}
        </div>
      )}

      <Card className="hud-corners border-border/70 bg-card/70">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Plus className="size-3.5" /> Novo quiz
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_120px_120px_auto]">
            <select
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={newQuiz.lessonId}
              onChange={(e) => setNewQuiz((f) => ({ ...f, lessonId: e.target.value }))}
            >
              <option value="">Selecione a aula…</option>
              {availableLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.course} · {l.title}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Nota mín."
              value={newQuiz.passingScore}
              onChange={(e) => setNewQuiz((f) => ({ ...f, passingScore: Number(e.target.value) }))}
            />
            <Input
              type="number"
              placeholder="XP"
              value={newQuiz.xpAward}
              onChange={(e) => setNewQuiz((f) => ({ ...f, xpAward: Number(e.target.value) }))}
            />
            <Button onClick={createQuiz} disabled={action === "create"}>
              {action === "create" ? <Loader2 className="size-4 animate-spin" /> : "Criar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando quizzes...</div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hud-corners border-border/70 bg-card/70">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                    <Brain className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold text-foreground">{quiz.lesson.title}</div>
                    <div className="mt-0.5 flex gap-2 font-mono text-[11px] text-muted-foreground">
                      <span>{quiz._count.questions} perguntas</span>
                      <span>·</span>
                      <span>{quiz._count.attempts} tentativas</span>
                      <span>·</span>
                      <span>mín {quiz.passingScore}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openManage(quiz)}>
                  {action === `load-${quiz.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <ChevronRight className="size-3.5" />}
                  Gerenciar
                </Button>
              </CardContent>
            </Card>
          ))}
          {quizzes.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Nenhum quiz cadastrado.</p>}
        </div>
      )}

      {managing && (
        <Card className="hud-corners border-primary/40 bg-card/70">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Perguntas</div>
                <h2 className="font-display text-base font-semibold text-foreground">{managing.lesson.title}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setManaging(null)}>Fechar</Button>
            </div>

            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={q.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <div>
                    <div className="text-sm text-foreground">{i + 1}. {q.prompt}</div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {q.options.map((o, oi) => (
                        <Badge key={oi} variant="outline" className="font-mono text-[10px]">{o}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={action === q.id}
                    onClick={() => removeQuestion(q.id)}
                  >
                    {action === q.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                  </Button>
                </div>
              ))}
              {questions.length === 0 && <p className="text-sm text-muted-foreground">Sem perguntas ainda.</p>}
            </div>

            <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Adicionar pergunta</div>
              <Textarea
                placeholder="Enunciado"
                value={newQuestion.prompt}
                onChange={(e) => setNewQuestion((f) => ({ ...f, prompt: e.target.value }))}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {newQuestion.options.map((opt, i) => (
                  <Input
                    key={i}
                    placeholder={`Opção ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={(e) =>
                      setNewQuestion((f) => ({ ...f, options: f.options.map((o, oi) => (oi === i ? e.target.value : o)) }))
                    }
                  />
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                <div className="space-y-1">
                  <Label className="font-mono text-[11px] text-muted-foreground">Resposta correta</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    value={newQuestion.correctIndex}
                    onChange={(e) => setNewQuestion((f) => ({ ...f, correctIndex: Number(e.target.value) }))}
                  >
                    {newQuestion.options.map((_, i) => (
                      <option key={i} value={i}>Opção {String.fromCharCode(65 + i)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="font-mono text-[11px] text-muted-foreground">Explicação (opcional)</Label>
                  <Input
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion((f) => ({ ...f, explanation: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={addQuestion} disabled={action === "question"} className="gap-1.5">
                {action === "question" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
