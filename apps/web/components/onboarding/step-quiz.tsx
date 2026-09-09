"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { API_BASE, getAuthHeaders } from "@/lib/api/client"

interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
}

const SKILLS = ["sql", "python", "excel", "power-bi", "tableau", "statistics", "etl", "machine-learning"]

interface StepQuizProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepQuiz({ data, onUpdate }: StepQuizProps) {
  const [currentSkill, setCurrentSkill] = useState(0)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>(data.quizAnswers || {})
  const [loading, setLoading] = useState(true)

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/ai/quiz/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          skillId: SKILLS[currentSkill],
          targetDifficulty: 3,
          count: 3,
        }),
      })
      const result = await res.json()
      setQuestions(result.items || [])
    } catch (error) {
      console.error("Failed to load questions:", error)
    } finally {
      setLoading(false)
    }
  }, [currentSkill])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleAnswer = (questionId: string, selectedIndex: number) => {
    const newAnswers = { ...answers, [questionId]: selectedIndex }
    setAnswers(newAnswers)
    onUpdate({ quizAnswers: newAnswers })
  }

  const progress = ((currentSkill + 1) / SKILLS.length) * 100

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Quiz Diagnóstico - {SKILLS[currentSkill].replace("-", " ").toUpperCase()}
        </h3>
        <p className="text-slate-400 text-sm">
          Responda rapidamente para avaliarmos seu nível atual.
        </p>
        <Progress value={progress} className="mt-2 h-1" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div key={q.id} className="space-y-3">
              <p className="text-white font-medium">
                {qi + 1}. {q.prompt}
              </p>
              <RadioGroup
                value={answers[q.id]?.toString()}
                onValueChange={(v: string) => handleAnswer(q.id, parseInt(v))}
                className="space-y-2"
              >
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-slate-600 hover:border-slate-500"
                  >
                    <RadioGroupItem value={oi.toString()} id={`${q.id}-${oi}`} className="text-purple-500" />
                    <Label htmlFor={`${q.id}-${oi}`} className="text-slate-300 cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => { setLoading(true); setCurrentSkill((prev) => Math.max(0, prev - 1)) }}
          disabled={currentSkill === 0}
          className="border-slate-600 text-slate-300"
        >
          Skill Anterior
        </Button>
        <Button
          onClick={() => { setLoading(true); setCurrentSkill((prev) => Math.min(SKILLS.length - 1, prev + 1)) }}
          disabled={currentSkill === SKILLS.length - 1}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Próxima Skill
        </Button>
      </div>
    </div>
  )
}
