"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, Target, BookOpen, Code } from "lucide-react"

interface StepFirstMissionProps {
  data: any
}

export function StepFirstMission({ data }: StepFirstMissionProps) {
  const firstMilestone = data.pdi?.milestones?.[0]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
          <Rocket className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Sua Jornada Começa Agora!</h3>
        <p className="text-slate-400 text-sm">
          Baseado no seu perfil, criamos sua primeira missão.
        </p>
      </div>

      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Target className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">
                {firstMilestone?.title || "Fundamentos de SQL"}
              </h4>
              <p className="text-slate-300 text-sm mb-3">
                {firstMilestone?.description || "Domine consultas básicas e intermediárias"}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {(firstMilestone?.skills || ["SQL", "Consultas"]).map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-slate-400">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {firstMilestone?.courses?.length || 2} cursos
                </div>
                <div className="flex items-center text-slate-400">
                  <Code className="h-4 w-4 mr-2" />
                  {firstMilestone?.projects?.length || 1} projeto
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-slate-400 text-sm">
          Clique em <span className="text-purple-400 font-medium">Começar!</span> para iniciar sua jornada.
        </p>
      </div>
    </div>
  )
}
