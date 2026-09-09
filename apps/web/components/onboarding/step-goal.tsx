"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const GOALS = [
  { id: "data-analyst", label: "Virar Analista de Dados", description: "SQL, Python, visualização" },
  { id: "data-engineer", label: "Virar Engenheiro de Dados", description: "Pipelines, Spark, cloud" },
  { id: "data-scientist", label: "Virar Cientista de Dados", description: "ML, estatística, pesquisa" },
  { id: "bi-developer", label: "Virar Desenvolvedor BI", description: "Power BI, Tableau, dashboards" },
  { id: "freelancer", label: "Freelancer em Dados", description: "Autônomo, projetos variados" },
  { id: "promotion", label: "Promoção no emprego atual", description: "Evoluir na empresa" },
]

interface StepGoalProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepGoal({ data, onUpdate }: StepGoalProps) {
  const [goal, setGoal] = useState(data.goal || "")
  const [description, setDescription] = useState(data.goalDescription || "")

  const handleChange = (value: string) => {
    setGoal(value)
    onUpdate({ goal: value })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setDescription(value)
    onUpdate({ goalDescription: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Qual é o seu objetivo?</h3>
        <p className="text-slate-400 text-sm">
          Isso vai nos ajudar a personalizar seu plano de desenvolvimento.
        </p>
      </div>

      <RadioGroup value={goal} onValueChange={handleChange} className="space-y-3">
        {GOALS.map((g) => (
          <div
            key={g.id}
            className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
              goal === g.id
                ? "border-purple-500 bg-purple-500/10"
                : "border-slate-600 hover:border-slate-500"
            }`}
          >
            <RadioGroupItem value={g.id} id={g.id} className="text-purple-500" />
            <Label htmlFor={g.id} className="flex-1 cursor-pointer">
              <div className="text-white font-medium">{g.label}</div>
              <div className="text-slate-400 text-sm">{g.description}</div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-slate-300">
          Conte mais sobre seu objetivo (opcional)
        </Label>
        <Textarea
          id="description"
          placeholder="Ex: Quero migrar de analista de marketing para analista de dados em 6 meses..."
          value={description}
          onChange={handleDescriptionChange}
          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
          rows={3}
        />
      </div>
    </div>
  )
}
