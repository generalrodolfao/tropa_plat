"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { aiApi } from "@/lib/api/service"

const SKILLS = ["sql", "python", "statistics", "excel"]

interface DiagnosticQuestion {
  prompt: string
  options: string[]
  correctIndex: number
  difficulty: number
  explanation: string
}

interface DiagnosticSection {
  skillId: string
  questions: DiagnosticQuestion[]
}

interface StepQuizProps {
  data: any
  onUpdate: (data: any) => void
}

function levelFromRatio(correct: number, total: number) {
  if (total === 0) return 0
  return Math.max(0, Math.min(5, Math.round((correct / total) * 5)))
}

export function StepQuiz({ data, onUpdate }: StepQuizProps) {
  const [sections, setSections] = useState<DiagnosticSection[]>(data.diagnosticSections || [])
  const [answers, setAnswers] = useState<Record<string, number>>(data.diagnosticAnswers || {})
  const [currentSkill, setCurrentSkill] = useState(0)
  const [loading, setLoading] = useState(sections.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [graded, setGraded] = useState(false)

  const loadDiagnostic = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await aiApi.generateDiagnostic(SKILLS, 3)
      const secs: DiagnosticSection[] = Array.isArray(result?.skills) ? result.skills : []
      setSections(secs)
      onUpdate({ diagnosticSections: secs })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível gerar o diagnóstico.")
    } finally {
      setLoading(false)
    }
  }, [onUpdate])

  useEffect(() => {
    if (sections.length === 0) loadDiagnostic()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const section = sections[currentSkill]

  const handleAnswer = (key: string, selectedIndex: number) => {
    const next = { ...answers, [key]: selectedIndex }
    setAnswers(next)
    onUpdate({ diagnosticAnswers: next })
  }

  const finish = () => {
    const levels: Record<string, number> = {}
    const scores: Record<string, { correct: number; total: number }> = {}
    for (const sec of sections) {
      let correct = 0
      sec.questions.forEach((q, i) => {
        if (answers[`${sec.skillId}:${i}`] === q.correctIndex) correct++
      })
      levels[sec.skillId] = levelFromRatio(correct, sec.questions.length)
      scores[sec.skillId] = { correct, total: sec.questions.length }
    }
    setGraded(true)
    onUpdate({ skillLevels: levels, diagnosticScores: scores })
  }

  const answerCount = Object.keys(answers).length
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0)
  const progress = totalQuestions > 0 ? (answerCount / totalQuestions) * 100 : 0

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="size-10 animate-spin text-purple-400" />
        <p className="mt-4 text-slate-300">Montando seu quiz diagnóstico...</p>
        <p className="mt-1 text-sm text-slate-500">A IA está calibrando as perguntas pelo seu nível</p>
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="space-y-4 py-10 text-center">
        <AlertTriangle className="mx-auto size-9 text-amber-400" />
        <p className="text-slate-300">Não foi possível carregar o diagnóstico.</p>
        {error && <p className="text-sm text-slate-500">{error}</p>}
        <Button variant="outline" className="border-slate-600 text-slate-300" onClick={loadDiagnostic}>
          <RefreshCw className="mr-2 size-4" /> Tentar novamente
        </Button>
        <div>
          <Button
            variant="ghost"
            className="text-slate-400"
            onClick={() => onUpdate({ skillLevels: Object.fromEntries(SKILLS.map((s) => [s, 0])) })}
          >
            Pular por agora
          </Button>
        </div>
      </div>
    )
  }

  if (graded) {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Diagnóstico concluído</h3>
          <p className="text-sm text-slate-400">Seu nível estimado por skill (0-5):</p>
        </div>
        <div className="space-y-3">
          {SKILLS.map((skill) => {
            const score = data.diagnosticScores?.[skill]
            const level = data.skillLevels?.[skill] ?? 0
            return (
              <div key={skill} className="flex items-center gap-3">
                <span className="w-24 font-mono text-sm uppercase text-slate-300">{skill}</span>
                <div className="flex flex-1 gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full ${i < level ? "bg-purple-500" : "bg-slate-600"}`}
                    />
                  ))}
                </div>
                <span className="w-16 text-right font-mono text-xs text-slate-400">
                  {score ? `${score.correct}/${score.total}` : `${level}/5`}
                </span>
              </div>
            )
          })}
        </div>
        <Button variant="ghost" className="text-slate-400" onClick={() => setGraded(false)}>
          Rever respostas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">
          Quiz Diagnóstico — {section.skillId.replace("-", " ").toUpperCase()}
        </h3>
        <p className="text-sm text-slate-400">Responda rapidamente para avaliarmos seu nível atual.</p>
        <Progress value={progress} className="mt-2 h-1" />
        <p className="mt-1 font-mono text-[11px] text-slate-500">
          {answerCount}/{totalQuestions} respondidas
        </p>
      </div>

      <div className="space-y-6">
        {section.questions.map((q, qi) => {
          const key = `${section.skillId}:${qi}`
          return (
            <div key={key} className="space-y-3">
              <p className="font-medium text-white">
                {qi + 1}. {q.prompt}
              </p>
              <RadioGroup
                value={answers[key]?.toString()}
                onValueChange={(v: string) => handleAnswer(key, parseInt(v))}
                className="space-y-2"
              >
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                      answers[key] === oi ? "border-purple-500 bg-purple-500/10" : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <RadioGroupItem value={oi.toString()} id={`${key}-${oi}`} className="text-purple-500" />
                    <Label htmlFor={`${key}-${oi}`} className="cursor-pointer text-slate-300">
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentSkill((prev) => Math.max(0, prev - 1))}
          disabled={currentSkill === 0}
          className="border-slate-600 text-slate-300"
        >
          Skill Anterior
        </Button>
        {currentSkill < sections.length - 1 ? (
          <Button
            onClick={() => setCurrentSkill((prev) => Math.min(sections.length - 1, prev + 1))}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Próxima Skill
          </Button>
        ) : (
          <Button onClick={finish} className="bg-purple-600 hover:bg-purple-700">
            Finalizar diagnóstico
          </Button>
        )}
      </div>
    </div>
  )
}
