"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StepGoal } from "./step-goal"
import { StepQuiz } from "./step-quiz"
import { StepCV } from "./step-cv"
import { StepLearningStyle } from "./step-learning-style"
import { StepPDI } from "./step-pdi"
import { StepFirstMission } from "./step-first-mission"
import { authApi } from "@/lib/api/service"
import { useAuthStore } from "@/store/authStore"

const STEPS = [
  { id: "goal", title: "Seu Objetivo", description: "Para onde você quer ir?" },
  { id: "quiz", title: "Quiz Diagnóstico", description: "Vamos avaliar suas skills" },
  { id: "cv", title: "Seu CV", description: "Upload para análise IA" },
  { id: "style", title: "Estilo de Aprendizado", description: "Como você aprende melhor?" },
  { id: "pdi", title: "Seu PDI", description: "Plano personalizado pela IA" },
  { id: "mission", title: "Primeira Missão", description: "Comece sua jornada!" },
]

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)

  const updateData = useCallback((stepData: any) => {
    setData((prev: any) => ({ ...prev, ...stepData }))
  }, [])

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
      return
    }

    // Completa onboarding: persiste objetivo + estilo no perfil
    setLoading(true)
    try {
      const updated = await authApi.updateMe({
        careerGoal: data.goalLabel ?? data.goal,
        learningStyle: data.learningStyle,
        ...(data.goalDescription ? { bio: data.goalDescription } : {}),
      })
      setUser(updated)
    } catch (error) {
      console.error("Falha ao salvar onboarding:", error)
    } finally {
      setLoading(false)
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-white">
                Passo {currentStep + 1} de {STEPS.length}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {STEPS[currentStep].description}
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-purple-400">
                {STEPS[currentStep].title}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="min-h-[400px]">
          {currentStep === 0 && <StepGoal data={data} onUpdate={updateData} />}
          {currentStep === 1 && <StepQuiz data={data} onUpdate={updateData} />}
          {currentStep === 2 && <StepCV data={data} onUpdate={updateData} />}
          {currentStep === 3 && <StepLearningStyle data={data} onUpdate={updateData} />}
          {currentStep === 4 && <StepPDI data={data} onUpdate={updateData} />}
          {currentStep === 5 && <StepFirstMission data={data} />}
        </CardContent>

        <div className="flex justify-between p-6 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="border-slate-600 text-slate-300"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? "Carregando..." : currentStep === STEPS.length - 1 ? "Começar!" : "Próximo"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
