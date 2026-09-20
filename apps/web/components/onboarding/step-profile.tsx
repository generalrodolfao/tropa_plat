"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// valores válidos na API: visual | auditivo | leitura | pratico
const STYLES = [
  { id: "pratico", label: "Prático", description: "Aprendo fazendo, codando e resolvendo problemas" },
  { id: "visual", label: "Visual", description: "Vídeos, diagramas e dashboards" },
  { id: "leitura", label: "Leitura", description: "Documentação, artigos e livros" },
  { id: "auditivo", label: "Auditivo", description: "Escuto explicações e podcasts" },
]

type ProfileData = {
  profileName?: string
  profileHeadline?: string
  profileBio?: string
  learningStyle?: string
}

interface StepProfileProps {
  data: any
  onUpdate: (data: Partial<ProfileData>) => void
}

export function StepProfile({ data, onUpdate }: StepProfileProps) {
  const [name, setName] = useState(data.profileName || "")
  const [headline, setHeadline] = useState(data.profileHeadline || "")
  const [bio, setBio] = useState(data.profileBio || "")
  const [style, setStyle] = useState(data.learningStyle || "")

  const nameInvalid = name.trim().length < 2

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">Complete seu cadastro</h3>
        <p className="text-sm text-slate-400">
          Isso personaliza seu treinamento e a forma como a IA monta o seu PDI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ob-name" className="text-slate-300">
            Nome completo
          </Label>
          <Input
            id="ob-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              onUpdate({ profileName: e.target.value })
            }}
            placeholder="Ex: Ana Ribeiro"
            className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500"
          />
          {nameInvalid && <p className="text-xs text-amber-400">Informe seu nome (mínimo 2 letras).</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ob-headline" className="text-slate-300">
            Headline (opcional)
          </Label>
          <Input
            id="ob-headline"
            value={headline}
            onChange={(e) => {
              setHeadline(e.target.value)
              onUpdate({ profileHeadline: e.target.value })
            }}
            placeholder="Ex: Analista de dados | SQL & Python"
            className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Como você aprende melhor?</Label>
        <RadioGroup value={style} onValueChange={(v) => { setStyle(v); onUpdate({ learningStyle: v }) }} className="grid gap-3 sm:grid-cols-2">
          {STYLES.map((s) => (
            <div
              key={s.id}
              className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                style === s.id ? "border-purple-500 bg-purple-500/10" : "border-slate-600 hover:border-slate-500"
              }`}
            >
              <RadioGroupItem value={s.id} id={`style-${s.id}`} className="text-purple-500" />
              <Label htmlFor={`style-${s.id}`} className="flex-1 cursor-pointer">
                <div className="font-medium text-white">{s.label}</div>
                <div className="text-sm text-slate-400">{s.description}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ob-bio" className="text-slate-300">
          Mini bio (opcional)
        </Label>
        <Textarea
          id="ob-bio"
          rows={2}
          value={bio}
          onChange={(e) => {
            setBio(e.target.value)
            onUpdate({ profileBio: e.target.value })
          }}
          placeholder="Ex: Sou formado em economia e quero migrar para dados..."
          className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500"
        />
      </div>
    </div>
  )
}
