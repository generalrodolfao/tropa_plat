"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"
import { StepWelcome } from "./step-welcome"
import { StepProfile } from "./step-profile"
import { StepGoal } from "./step-goal"
import { StepPath, type OnboardingPath } from "./step-path"
import { StepQuiz } from "./step-quiz"
import { StepCV } from "./step-cv"
import { StepPDI } from "./step-pdi"
import { StepFirstMission } from "./step-first-mission"
import { authApi, cvApi } from "@/lib/api/service"
import { useAuthStore } from "@/store/authStore"

type StepId = "welcome" | "profile" | "goal" | "path" | "quiz" | "pdi" | "cv" | "mission"

const ALL_STEPS: Record<StepId, { title: string; description: string }> = {
  welcome: { title: "Boas-vindas", description: "Um tour rápido pela Tropa" },
  profile: { title: "Completar cadastro", description: "Quem está na sala de operações?" },
  goal: { title: "Sua carreira", description: "Escolha a carreira que você quer seguir" },
  path: { title: "Seu caminho", description: "CV, trilha personalizada ou explorar" },
  quiz: { title: "Quiz diagnóstico", description: "Vamos avaliar suas skills" },
  pdi: { title: "Seu PDI", description: "Plano personalizado pela IA" },
  cv: { title: "Seu CV", description: "Upload para análise IA" },
  mission: { title: "Acesso liberado", description: "Seu treinamento começa agora!" },
}

function nextStepId(step: StepId, path?: OnboardingPath): StepId | null {
  switch (step) {
    case "welcome":
      return "profile"
    case "profile":
      return "goal"
    case "goal":
      return "path"
    case "path":
      if (path === "cv") return "cv"
      if (path === "pdi") return "quiz"
      return "mission"
    case "cv":
    case "quiz":
      return "pdi"
    case "pdi":
      return "mission"
    default:
      return null
  }
}

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [stepId, setStepId] = useState<StepId>("welcome")
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)

  const updateData = useCallback((stepData: any) => {
    setData((prev: any) => ({ ...prev, ...stepData }))
  }, [])

  // persiste o cadastro assim que sai da etapa de perfil
  useEffect(() => {
    if (stepId !== "goal") return
    if (!data.profileName && !data.learningStyle) return
    ;(async () => {
      setLoading(true)
      try {
        const updated = await authApi.updateMe({
          name: data.profileName || undefined,
          headline: data.profileHeadline || undefined,
          bio: data.profileBio || undefined,
          learningStyle: data.learningStyle || undefined,
        })
        setUser(updated)
      } catch (e) {
        console.error("Falha ao salvar cadastro:", e)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId])

  const finish = useCallback(
    async () => {
      setFinalizing(true)
      try {
        const updated = await authApi.updateMe({
          careerGoal: data.goalLabel ?? data.goal ?? "analisando-opcoes",
          learningStyle: data.learningStyle || undefined,
          bio: data.goalDescription || data.profileBio || undefined,
          onboardingDone: true,
        })
        setUser(updated)
      } catch (e) {
        console.error("Falha ao salvar onboarding:", e)
      } finally {
        setFinalizing(false)
        onComplete()
      }
    },
    [data, onComplete, setUser],
  )

  const handleNext = async () => {
    const next = nextStepId(stepId, data.path)
    if (stepId === "cv" && data.cvText) {
      setLoading(true)
      try {
        await cvApi.save({ text: data.cvText, parsed: data.cvParsed ?? undefined })
      } catch (e) {
        console.error("Falha ao salvar CV:", e)
      } finally {
        setLoading(false)
      }
    }
    if (next) {
      setStepId(next)
      return
    }
    await finish()
  }

  const handleBack = () => {
    // volta simples: para sub-fluxos, retornar ao passo anterior lógico
    const backMap: Partial<Record<StepId, StepId>> = { profile: "welcome", goal: "profile", path: "goal", cv: "path", pdi: "path", mission: "path" }
    if (stepId === "quiz") {
      setStepId("path")
      return
    }
    const back = backMap[stepId]
    if (back) setStepId(back)
  }

  const step = ALL_STEPS[stepId]
  const isFinal = stepId === "mission"
  const progress = isFinal ? 100 : Math.round(Object.keys(ALL_STEPS).indexOf(stepId) / (Object.keys(ALL_STEPS).length - 1) * 100)
  const canProceed =
    stepId !== "profile" ||
    ((data.profileName ?? "").trim().length >= 2 && !!data.learningStyle)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-2xl border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <CardTitle className="text-white">
                {isFinal ? "Pronto" : `Passo ${Object.keys(ALL_STEPS).indexOf(stepId)} de ${Object.keys(ALL_STEPS).length - 1}`}
              </CardTitle>
              <CardDescription className="text-slate-400">{step.description}</CardDescription>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-purple-400">{step.title}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="min-h-[400px]">
          {stepId === "welcome" && <StepWelcome />}
          {stepId === "profile" && <StepProfile data={data} onUpdate={updateData} />}
          {stepId === "goal" && <StepGoal data={data} onUpdate={updateData} />}
          {stepId === "path" && <StepPath data={data} onUpdate={updateData} />}
          {stepId === "cv" && <StepCV data={data} onUpdate={updateData} />}
          {stepId === "quiz" && <StepQuiz data={data} onUpdate={updateData} />}
          {stepId === "pdi" && <StepPDI data={data} onUpdate={updateData} />}
          {stepId === "mission" && <StepFirstMission data={data} />}
        </CardContent>

        <div className="flex items-center justify-between border-t border-slate-700 p-6">
          <div className="flex gap-2">
            {stepId !== "welcome" && !isFinal && (
              <Button variant="outline" onClick={handleBack} className="border-slate-600 text-slate-300">
                Voltar
              </Button>
            )}
            {(stepId === "path" || stepId === "cv" || stepId === "profile" || stepId === "goal") && !isFinal && (
              <Button
                variant="ghost"
                disabled={finalizing}
                onClick={() => finish()}
                className="text-slate-400 hover:text-slate-200"
              >
                Pular e explorar a plataforma
              </Button>
            )}
          </div>
          <Button
            onClick={handleNext}
            disabled={loading || finalizing || !canProceed}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {(loading || finalizing) && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isFinal ? "Acessar cursos" : stepId === "path" && data.path !== "skip" ? "Continuar" : "Próximo"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
