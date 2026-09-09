"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { API_BASE, getAuthHeaders } from "@/lib/api/client"

interface Milestone {
  title: string
  description: string
  skills: string[]
  estimatedWeeks: number
  courses: Array<{ title: string; reason: string }>
  projects: Array<{ title: string; description: string }>
}

interface StepPDIData {
  milestones: Milestone[]
  totalWeeks: number
  weeklyHours: number
}

interface StepPDIProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepPDI({ data, onUpdate }: StepPDIProps) {
  const [pdi, setPdi] = useState<StepPDIData | null>(data.pdi || null)
  const [loading, setLoading] = useState(!data.pdi)

  const generatePDI = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/ai/pdi/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          objective: data.goal || "Virar Analista de Dados",
          currentSkills: JSON.stringify(
            Object.entries(data.quizAnswers || {}).map(([skillId, level]) => ({
              skillId,
              level: typeof level === "number" ? level : 0,
            }))
          ),
          learningStyle: data.learningStyle,
          hoursPerWeek: 10,
        }),
      })
      const result = await res.json()
      setPdi(result)
      onUpdate({ pdi: result })
    } catch (error) {
      console.error("Failed to generate PDI:", error)
    } finally {
      setLoading(false)
    }
  }, [data, onUpdate])

  useEffect(() => {
    if (!pdi) {
      generatePDI()
    }
  }, [generatePDI, pdi])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4" />
        <p className="text-slate-300">Gerando seu plano personalizado...</p>
        <p className="text-slate-500 text-sm mt-1">A IA está analisando seu perfil</p>
      </div>
    )
  }

  if (!pdi) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Erro ao gerar PDI. Tente novamente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Seu Plano Personalizado</h3>
        <p className="text-slate-400 text-sm">
          Estimativa: {pdi.totalWeeks} semanas • {pdi.weeklyHours}h por semana
        </p>
      </div>

      <div className="space-y-4">
        {pdi.milestones.map((milestone, index) => (
          <Card key={index} className="bg-slate-700/30 border-slate-600">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">
                  {index + 1}. {milestone.title}
                </CardTitle>
                <Badge variant="outline" className="text-purple-400 border-purple-500">
                  {milestone.estimatedWeeks} semanas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-slate-300 text-sm">{milestone.description}</p>
              
              <div>
                <p className="text-slate-400 text-xs mb-1">Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {milestone.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {milestone.courses.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs mb-1">Cursos:</p>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {milestone.courses.map((course, i) => (
                      <li key={i}>• {course.title}</li>
                    ))}
                  </ul>
                </div>
              )}

              {milestone.projects.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs mb-1">Projetos:</p>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {milestone.projects.map((project, i) => (
                      <li key={i}>• {project.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
