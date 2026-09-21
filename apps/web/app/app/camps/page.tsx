"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Briefcase,
  ChevronRight,
  Code2,
  Database,
  Flame,
  Loader2,
  Mic,
  Sparkles,
  Target,
} from "lucide-react"
import { campsApi } from "@/lib/api/service"
import type { Camp } from "@/lib/api/client"

const FORMAT_LABEL: Record<string, string> = {
  quiz: "Quiz",
  exercise: "Exercício",
  interview: "Entrevista",
  requirements: "Requisitos",
  hotseat: "Hotseat",
}

function CampIcon({ icon, className }: { icon: string | null; className?: string }) {
  if (icon === "database") return <Database className={className} />
  if (icon === "code") return <Code2 className={className} />
  if (icon === "briefcase") return <Briefcase className={className} />
  if (icon === "mic") return <Mic className={className} />
  return <Target className={className} />
}

export default function CampsPage() {
  const [camps, setCamps] = useState<Camp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    campsApi
      .list()
      .then((data) => setCamps(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Não foi possível carregar os camps."),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary">
            <Flame className="size-3.5" /> Treino intensivo
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
            Camps &amp; Hotseat
          </h1>
          <p className="mt-2 max-w-2xl font-mono text-xs text-muted-foreground">
            Sessões de perguntas aleatórias, exercícios, simulado de entrevista e levantamento de
            requisitos — corrigidas na hora.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando camps...
        </div>
      ) : camps.length === 0 ? (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-8 text-center">
            <Flame className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold text-foreground">
              Nenhum camp disponível
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Os camps ainda não foram publicados. Volte em breve.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {camps.map((camp) => (
            <Card
              key={camp.id}
              className="hud-corners border-border/70 bg-card/70 transition-colors hover:border-primary/40"
            >
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                    <CampIcon icon={camp.icon} className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-foreground">
                        {camp.title}
                      </h3>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        {camp.difficulty}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {camp.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {camp.formats.map((f) => (
                    <Badge key={f} variant="secondary" className="font-mono text-[10px]">
                      {FORMAT_LABEL[f] ?? f}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="size-3.5" /> {camp.stats.sessions} sessões
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3.5 text-accent" /> melhor {camp.stats.bestScore}/100
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    +{camp.xpAward} XP
                  </span>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href={`/app/camps/${camp.slug}`}>
                      Treinar <ChevronRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
