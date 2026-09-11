"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FileText, RefreshCw, AlertTriangle, CheckCircle2, Lightbulb, ScanSearch, Loader2, Sparkles, UploadCloud } from "lucide-react"
import { aiApi } from "@/lib/api/service"
import type { CvReview } from "@/lib/api/client"

const STORAGE_KEY = "cv_review"

function scoreColor(s: number) {
  if (s >= 85) return "text-accent"
  if (s >= 70) return "text-primary"
  if (s >= 50) return "text-yellow-500"
  return "text-destructive"
}

export default function CvPage() {
  const [cvText, setCvText] = useState("")
  const [targetRole, setTargetRole] = useState("Analista de Dados")
  const [review, setReview] = useState<CvReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { cvText?: string; targetRole?: string; review?: CvReview }
      if (parsed.cvText) setCvText(parsed.cvText)
      if (parsed.targetRole) setTargetRole(parsed.targetRole)
      if (parsed.review) setReview(parsed.review)
    } catch {
      // ignora cache corrompido
    }
  }, [])

  async function handleAnalyze() {
    setError(null)
    if (cvText.trim().length < 50) {
      setError("Cole o texto do seu CV (mínimo 50 caracteres) para a análise.")
      return
    }
    setLoading(true)
    try {
      const result = await aiApi.reviewCv(cvText, targetRole)
      setReview(result)
      setEditing(false)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cvText, targetRole, review: result }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao analisar o CV.")
    } finally {
      setLoading(false)
    }
  }

  const showForm = !review || editing

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Revisão com IA</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">CV em combate</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Análise contra vagas de dados · ATS-friendly · feedback por seção
          </p>
        </div>
        {review && !editing && (
          <Button className="gap-2" onClick={() => setEditing(true)} disabled={loading}>
            <RefreshCw className="size-4" /> Reanalisar CV
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="hud-corners border-border/70 bg-card/70">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <UploadCloud className="size-3.5 text-primary" /> Cole o conteúdo do seu CV
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
              <Textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Cole aqui o texto do seu CV (experiência, skills, formação, projetos)..."
                className="min-h-56 font-mono text-xs"
              />
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-[11px] text-muted-foreground" htmlFor="targetRole">
                    Cargo alvo
                  </label>
                  <Input
                    id="targetRole"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="mt-1"
                    placeholder="Analista de Dados"
                  />
                </div>
                <Button className="w-full gap-2" onClick={handleAnalyze} disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {loading ? "Analisando..." : "Analisar CV"}
                </Button>
                {error && (
                  <p className="flex items-start gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {error}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  O texto é anonimizado (CPF, e-mail, telefone) antes de ir para a IA.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {review && !editing && (
        <div className="grid gap-6 lg:grid-cols-[0.55fr_1fr]">
          <div className="space-y-4">
            <Card className="hud-corners relative overflow-hidden border-border/70 bg-card/70">
              <CardContent className="relative flex flex-col items-center p-6">
                <div className="pointer-events-none absolute right-0 top-0 size-48 rounded-full bg-accent/10 blur-3xl" />
                <div className="relative">
                  <div className="relative mx-auto grid size-32 place-items-center rounded-full border-4 border-border bg-background/60">
                    <span className={`font-display text-5xl font-bold ${scoreColor(review.overallScore)}`}>
                      {review.overallScore}
                    </span>
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-background px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Score geral
                  </span>
                </div>
                <div className="mt-8 w-full">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                      <ScanSearch className="size-3.5" /> Compatibilidade ATS
                    </span>
                    <span className={`font-mono text-sm font-bold ${scoreColor(review.atsScore)}`}>{review.atsScore}</span>
                  </div>
                  <Progress value={review.atsScore} className="h-1.5" />
                </div>
                <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    CV colado · {cvText.length} caracteres · alvo: {targetRole}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="hud-corners rounded-xl border border-border/60 bg-card/70 p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Lightbulb className="size-3.5 text-accent" /> Resumo da IA
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.summary}</p>
            </div>

            {review.strengths.length > 0 && (
              <div className="hud-corners rounded-xl border border-accent/30 bg-accent/5 p-5">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                  <CheckCircle2 className="size-3.5" /> Pontos fortes
                </div>
                <ul className="mt-3 space-y-2">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {review.sections.map((s) => (
                <Card key={s.title} className="hud-corners border-border/70 bg-card/70">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-semibold text-foreground">{s.title}</span>
                      <span className={`font-mono text-xl font-bold ${scoreColor(s.score)}`}>{s.score}</span>
                    </div>
                    <Progress
                      value={s.score}
                      className="mt-3 h-1.5"
                      indicatorClassName={s.score >= 85 ? "bg-accent" : s.score >= 70 ? "bg-primary" : "bg-yellow-500"}
                    />
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{s.feedback}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="hud-corners border-border/70 bg-card/70">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <AlertTriangle className="size-3.5 text-yellow-500" /> Ajustes de alto impacto
                </div>
                <ul className="mt-4 space-y-3">
                  {review.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 font-mono text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{imp}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button className="gap-2" onClick={() => setEditing(true)}>
                    <UploadCloud className="size-4" /> Enviar novo CV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <Badge variant="outline" className="shrink-0 border-accent/40 px-2 py-1 font-mono text-[10px] text-accent">
                em beta
              </Badge>
              <p className="text-sm text-muted-foreground">
                A revisão usa apenas o conteúdo do seu CV e o perfil das vagas do mural. Nada é usado para treinar modelos de terceiros.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
