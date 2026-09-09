"use client"

import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const STYLES = [
  {
    id: "visual",
    label: "Visual",
    description: "Aprendo melhor com gráficos, diagramas e vídeos",
    icon: "👁️",
  },
  {
    id: "reading",
    label: "Leitura",
    description: "Prefiro ler documentação, artigos e livros",
    icon: "📚",
  },
  {
    id: "hands-on",
    label: "Prático",
    description: "Aprendo fazendo, codando e resolvendo problemas",
    icon: "🛠️",
  },
  {
    id: "social",
    label: "Social",
    description: "Aprendo melhor em grupo, discutindo e debatendo",
    icon: "👥",
  },
  {
    id: "structured",
    label: "Estruturado",
    description: "Prefiro cursos com trilha e exercícios progressivos",
    icon: "📋",
  },
]

interface StepLearningStyleProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepLearningStyle({ data, onUpdate }: StepLearningStyleProps) {
  const [style, setStyle] = useState(data.learningStyle || "")

  const handleChange = (value: string) => {
    setStyle(value)
    onUpdate({ learningStyle: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Como você aprende melhor?</h3>
        <p className="text-slate-400 text-sm">
          Isso vai nos ajudar a recomendar o tipo certo de conteúdo para você.
        </p>
      </div>

      <RadioGroup value={style} onValueChange={handleChange} className="space-y-3">
        {STYLES.map((s) => (
          <div
            key={s.id}
            className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
              style === s.id
                ? "border-purple-500 bg-purple-500/10"
                : "border-slate-600 hover:border-slate-500"
            }`}
          >
            <RadioGroupItem value={s.id} id={s.id} className="text-purple-500" />
            <span className="text-2xl">{s.icon}</span>
            <Label htmlFor={s.id} className="flex-1 cursor-pointer">
              <div className="text-white font-medium">{s.label}</div>
              <div className="text-slate-400 text-sm">{s.description}</div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
