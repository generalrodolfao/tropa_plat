"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Flame,
  History,
  ListChecks,
  Loader2,
  Play,
  Swords,
  Timer,
} from "lucide-react"
import { campsApi } from "@/lib/api/service"
import type {
  Camp,
  CampFormat,
  CampSessionHistoryItem,
  CampSessionStart,
} from "@/lib/api/client"
import { CampSessionRunner } from "@/components/camp-session"

type CampDetail = Camp & { sessions: CampSessionHistoryItem[] }

const FORMAT_META: Record<string, { label: string; desc: string }> = {
  quiz: { label: "Quiz", desc: "Múltipla escolha com correção imediata" },
  exercise: { label: "Exercício", desc: "Prática aberta corrigida por IA" },
  interview: { label: "Entrevista", desc: "Simulado de entrevista" },
  requirements: { label: "Requisitos", desc: "Levantamento de requisitos" },
  hotseat: { label: "Hotseat", desc: "Sabatina cronometrada" },
}

const COUNT_OPTIONS = [3, 5, 8, 10]

export default function CampDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [camp, setCamp] = useState<CampDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [format, setFormat] = useState<string>("mixed")
  const [count, setCount] = useState(5)
  const [mode, setMode] = useState<"standard" | "hotseat">("standard")
  const [starting, setStarting] = useState(false)
  const [session, setSession] = useState<CampSessionStart | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await campsApi.get(slug)
      setCamp(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o camp.")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (slug) void load()
  }, [slug, load])

  const start = useCallback(
    async (cfg?: { format: string; count: number; mode: "standard" | "hotseat" }) => {
      const chosen = cfg ?? { format, count, mode }
      setStarting(true)
      setError(null)
      try {
        const s = await campsApi.startSession(slug, {
          format: chosen.format,
          count: chosen.count,
          mode: chosen.mode,
        })
        setSession(s)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível iniciar a sessão.")
      } finally {
        setStarting(false)
      }
    },
    [slug, format, count, mode],
  )

  if (session) {
    return (
      <CampSessionRunner
        session={session}
        onExit={() => {
          setSession(null)
          void load()
        }}
        onRestart={() => void start({ format, count, mode })}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando camp...
      </div>
    )
  }

  if (!camp) {
    return (
      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-8 text-center">
          <Flame className="mx-auto mb-4 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error ?? "Camp não encontrado."}</p>
          <Button asChild variant="outline" className="mt-4 gap-1.5">
            <Link href="/app/camps">
              <ArrowLeft className="size-4" /> Voltar aos camps
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const formatOptions: Array<{ value: string; label: string; desc: string; bank?: number }> = [
    {
      value: "mixed",
      label: "Misto",
      desc: "Mistura todos os formatos do camp",
      bank: Object.values(camp.bank ?? {}).reduce((a, b) => a + b, 0),
    },
    ...camp.formats.map((f: CampFormat) => ({
      value: f,
      label: FORMAT_META[f]?.label ?? f,
      desc: FORMAT_META[f]?.desc ?? "",
      bank: camp.bank?.[f] ?? 0,
    })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/app/camps">
            <ArrowLeft className="size-4" /> Camps
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary">
            <Flame className="size-3.5" /> {camp.category}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
            {camp.title}
          </h1>
          <p className="mt-2 max-w-2xl font-mono text-xs text-muted-foreground">
            {camp.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {camp.difficulty}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            +{camp.xpAward} XP
          </Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="hud-corners border-border/70 bg-card/70">
        <CardContent className="space-y-6 p-6">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks className="size-4 text-primary" />
              <h2 className="font-display text-sm font-semibold text-foreground">
                Formato da sessão
              </h2>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {formatOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setFormat(opt.value)
                    if (opt.value === "hotseat") setMode("hotseat")
                  }}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    format === opt.value
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/60 bg-muted/20 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    {!!opt.bank && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {opt.bank} no banco
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-sm font-semibold text-foreground">
                Quantidade de itens
              </h2>
              <div className="mt-3 flex gap-2">
                {COUNT_OPTIONS.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={count === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCount(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-sm font-semibold text-foreground">Modo</h2>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant={mode === "standard" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setMode("standard")}
                >
                  <Swords className="size-3.5" /> Padrão
                </Button>
                <Button
                  type="button"
                  variant={mode === "hotseat" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setMode("hotseat")}
                >
                  <Timer className="size-3.5" /> Hotseat
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                No hotseat cada item tem tempo limitado (45s).
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="gap-1.5" onClick={() => void start()} disabled={starting}>
              {starting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Play className="size-4" /> Iniciar treino
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {camp.sessions?.length > 0 && (
        <Card className="border-border/70 bg-card/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              <h2 className="font-display text-sm font-semibold text-foreground">
                Sessões recentes
              </h2>
            </div>
            <div className="mt-3 divide-y divide-border/60">
              {camp.sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {FORMAT_META[s.format]?.label ?? s.format}
                    </Badge>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {new Date(s.startedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold ${
                      s.score >= 60 ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {s.status === "finished" ? `${s.score}/100` : "em andamento"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
