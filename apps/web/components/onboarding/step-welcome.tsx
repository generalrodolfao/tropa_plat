"use client"

import { Target, Video, Trophy, Rocket } from "lucide-react"

export function StepWelcome() {
  return (
    <div className="py-8 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-white">Boas-vindas à Tropa!</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-400">
        Em poucos minutos vamos montar seu treinamento sob medida.
        <br />
        Sem enrolação.
      </p>
      <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
        {[
          {
            icon: Target,
            title: "Você escolhe a carreira",
            text: "Analista, Engenheiro, Cientista de Dados ou BI.",
          },
          {
            icon: Video,
            title: "Cursos liberados",
            text: "O catálogo completo abre após o onboarding. Você pode pular e explorar.",
          },
          {
            icon: Trophy,
            title: "XP e patentes",
            text: "Cada aula concluída sobe você de patente na liga.",
          },
          {
            icon: Rocket,
            title: "CV ou PDI",
            text: "Envie seu currículo ou crie um trilho personalizado.",
          },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-700/30 p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-purple-500/15">
              <f.icon className="size-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white">{f.title}</p>
              <p className="mt-0.5 text-sm text-slate-400">{f.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
