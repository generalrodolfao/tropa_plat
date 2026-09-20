"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, Route, ArrowRight, Shuffle } from "lucide-react"

export type OnboardingPath = "cv" | "pdi" | "skip"

interface StepPathProps {
  data: any
  onUpdate: (data: any) => void
}

const OPTIONS = [
  {
    id: "cv" as const,
    icon: FileText,
    title: "Enviar currículo",
    text: "Cole seu CV e a IA extrai skills, experiência e oportunidades de melhoria.",
  },
  {
    id: "pdi" as const,
    icon: Route,
    title: "Criar trilha personalizada",
    text: "Quiz rápido de nivelamento + PDI gerado pela IA para a sua carreira.",
  },
  {
    id: "skip" as const,
    icon: Shuffle,
    title: "Pular e explorar",
    text: "Liberar acesso agora, com cursos sugeridos para a sua carreira. Depois dá para configurar.",
  },
]

export function StepPath({ data, onUpdate }: StepPathProps) {
  const choose = (id: OnboardingPath) => onUpdate({ path: id })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-lg font-semibold text-white">
          {data.goalLabel ? `Carreira: ${data.goalLabel}` : "Como você prefere começar?"}
        </h3>
        <p className="text-sm text-slate-400">
          Escolha um caminho. Todos liberam acesso ao catálogo de cursos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const selected = data.path === o.id
          return (
            <Card
              key={o.id}
              onClick={() => choose(o.id)}
              className={`cursor-pointer border transition-colors hover:border-purple-500/60 ${
                selected ? "border-purple-500 bg-purple-500/10" : "border-slate-700 bg-slate-700/40"
              }`}
            >
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="grid size-11 place-items-center rounded-lg bg-purple-500/15">
                  <o.icon className="size-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{o.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{o.text}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-purple-300">
                  {selected ? "Selecionado" : "Selecionar"} <ArrowRight className="size-3.5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
