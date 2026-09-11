"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { aiApi, pdiApi } from "@/lib/api/service"

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
  const [error, setError] = useState<string | null>(null)

  const generatePDI = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const levels = data.skillLevels || {}
      const currentSkills = JSON.stringify(
        (Object.keys(levels).length > 0 ? Object.entries(levels) : [["sql", 0], ["python", 0]]).map(
          ([skillId, level]) => ({ skillId, level }),
        ),
      )

      const result = await aiApi.generatePdi({
        objective: data.goalLabel || data.goal || "Virar Analista de Dados",
        currentSkills,
        learningStyle: data.learningStyle,
        hoursPerWeek: 10,
      })

      if (!result?.milestones?.length) throw new Error("Plano vazio retornado pela IA")
      setPdi(result)
      onUpdate({ pdi: result })

      // persiste o plano para aparecer em /app/pdi
      try {
        await pdiApi.savePlan({
          objective: data.goalLabel || data.goal || "Analista de Dados",
          totalWeeks: result.totalWeeks,
          weeklyHours: result.weeklyHours,
          milestones: result.milestones.map((m: Milestone) => ({
            title: m.title,
            description: m.description,
            skills: m.skills,
            estimatedWeeks: m.estimatedWeeks,
            courses: m.courses,
            projects: m.projects,
          })),
        })
      } catch {
        // não bloqueia o onboarding se a persistência falhar
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar o PDI.")
    } finally {
      setLoading(false)
    }
  }, [data, onUpdate])

  useEffect(() => {
    if (!pdi) generatePDI()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-4 size-12 animate-spin text-purple-400" />
        <p className="text-slate-300">Gerando seu plano personalizado...</p>
        <p className="mt-1 text-sm text-slate-500">A IA está analisando seu perfil</p>
      </div>
    )
  }

  if (!pdi) {
    return (
      <div className="space-y-4 py-10 text-center">
        <AlertTriangle className="mx-auto size-9 text-amber-400" />
        <p className="text-slate-300">Não foi possível gerar seu PDI.</p>
        {error && <p className="text-sm text-slate-500">{error}</p>}
        <Button variant="outline" className="border-slate-600 text-slate-300" onClick={generatePDI}>
          <RefreshCw className="mr-2 size-4" /> Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">Seu Plano Personalizado</h3>
        <p className="text-sm text-slate-400">
          Estimativa: {pdi.totalWeeks} semanas • {pdi.weeklyHours}h por semana
        </p>
      </div>

      <div className="space-y-4">
        {pdi.milestones.map((milestone, index) => (
          <Card key={index} className="border-slate-600 bg-slate-700/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white">
                  {index + 1}. {milestone.title}
                </CardTitle>
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  {milestone.estimatedWeeks} semanas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-300">{milestone.description}</p>

              {milestone.skills?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-slate-400">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {milestone.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {milestone.courses?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-slate-400">Cursos:</p>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {milestone.courses.map((course, i) => (
                      <li key={i}>• {course.title}</li>
                    ))}
                  </ul>
                </div>
              )}

              {milestone.projects?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-slate-400">Projetos:</p>
                  <ul className="space-y-1 text-sm text-slate-300">
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

      <Button variant="ghost" className="text-slate-400" onClick={generatePDI}>
        <RefreshCw className="mr-2 size-4" /> Gerar novamente
      </Button>
    </div>
  )
}
