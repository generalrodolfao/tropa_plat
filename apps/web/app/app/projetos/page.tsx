"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code2, CheckCircle2, Clock, Send, Loader2, AlertTriangle, ClipboardCheck, X } from "lucide-react"
import { projectsApi } from "@/lib/api/service"
import { useAuthStore } from "@/store/authStore"

interface ProjectSubmission {
  projectId: string
  status: string
  score: number | null
}

interface Project {
  id: string
  title: string
  briefMd: string | null
  evaluationMode: string
  xpAward: number
  submission: ProjectSubmission | null
}

interface PendingSubmission {
  id: string
  userId: string
  projectId: string
  status: string
  submittedAt: string
  project: { title: string }
  user: { name: string; email: string }
}

function statusBadge(status: string) {
  if (status === "graded") return { label: "corrigido", className: "text-accent" }
  if (status === "pending") return { label: "aguardando correção", className: "" }
  return { label: status, className: "text-muted-foreground" }
}

export default function ProjetosPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.roles?.includes("admin") ?? false

  const [projects, setProjects] = useState<Project[]>([])
  const [pending, setPending] = useState<PendingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Project | null>(null)
  const [form, setForm] = useState({ submissionUrl: "", description: "" })
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [grading, setGrading] = useState<{ id: string; score: string; feedback: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const [list, pend] = await Promise.allSettled([
        projectsApi.list(),
        isAdmin ? projectsApi.pending() : Promise.resolve([]),
      ])
      if (list.status === "fulfilled") setProjects(Array.isArray(list.value) ? list.value : [])
      if (pend.status === "fulfilled") setPending(Array.isArray(pend.value) ? pend.value : [])
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    load()
  }, [load])

  async function submitProject() {
    if (!selected || !form.submissionUrl.trim()) return
    setError(null)
    setActionId("submit")
    try {
      await projectsApi.submit({
        projectId: selected.id,
        submissionUrl: form.submissionUrl.trim(),
        description: form.description.trim() || undefined,
      })
      setSelected(null)
      setForm({ submissionUrl: "", description: "" })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível submeter o projeto.")
    } finally {
      setActionId(null)
    }
  }

  async function gradeSubmission() {
    if (!grading) return
    const score = Number(grading.score)
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setError("A nota deve estar entre 0 e 100.")
      return
    }
    setError(null)
    setActionId(grading.id)
    try {
      await projectsApi.grade({ submissionId: grading.id, score, feedback: grading.feedback })
      setGrading(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível avaliar a submissão.")
    } finally {
      setActionId(null)
    }
  }

  const submitted = projects.filter((p) => p.submission).length
  const graded = projects.filter((p) => p.submission?.status === "graded").length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Aprender fazendo</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Projetos</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Desafios práticos com correção · portfólio real para o mural de vagas
          </p>
        </div>
        <div className="hud-corners flex items-center gap-5 rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <Stat label="Disponíveis" value={projects.length} />
          <Stat label="Submetidos" value={submitted} accent />
          <Stat label="Corrigidos" value={graded} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" /> {error}
        </div>
      )}

      <Tabs defaultValue="projetos">
        <TabsList className={isAdmin ? "grid w-full max-w-md grid-cols-2" : ""}>
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="correcoes">
              Correções {pending.length > 0 && `(${pending.length})`}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="projetos" className="mt-4">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando projetos...</div>
          ) : projects.length === 0 ? (
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-8 text-center">
                <Code2 className="mx-auto mb-4 size-12 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold text-foreground">Nenhum projeto disponível</h3>
                <p className="mt-2 text-sm text-muted-foreground">Novos projetos serão liberados em breve.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((p) => {
                const badge = p.submission ? statusBadge(p.submission.status) : null
                return (
                  <Card key={p.id} className="hud-corners border-border/70 bg-card/70">
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                            <Code2 className="size-4 text-primary" />
                          </div>
                          <Badge variant="outline" className="px-2 py-0 font-mono text-[10px]">
                            {p.evaluationMode === "auto" ? "correção automática" : "correção por mentor"}
                          </Badge>
                        </div>
                        <span className="font-mono text-xs font-bold text-primary">+{p.xpAward} XP</span>
                      </div>
                      <h3 className="mt-3 font-display text-base font-semibold text-foreground">{p.title}</h3>
                      {p.briefMd && (
                        <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">{p.briefMd}</p>
                      )}
                      <div className="mt-4 flex items-center justify-between gap-2">
                        {badge ? (
                          <Badge variant="secondary" className={`gap-1 px-2.5 py-1 text-[11px] ${badge.className}`}>
                            {p.submission?.status === "graded" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                            {badge.label}
                            {p.submission?.status === "graded" && p.submission.score != null ? ` · ${p.submission.score}/100` : ""}
                          </Badge>
                        ) : (
                          <span className="font-mono text-[11px] text-muted-foreground">não iniciado</span>
                        )}
                        <Button
                          size="sm"
                          variant={p.submission ? "outline" : "default"}
                          className="gap-1.5"
                          disabled={p.submission?.status === "pending"}
                          onClick={() => {
                            setSelected(p)
                            setForm({ submissionUrl: "", description: "" })
                          }}
                        >
                          {p.submission ? "Reenviar" : "Submeter"} <Send className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="correcoes" className="mt-4">
            {pending.length === 0 ? (
              <Card className="border-border/60 bg-card/60">
                <CardContent className="p-8 text-center">
                  <ClipboardCheck className="mx-auto mb-4 size-12 text-muted-foreground" />
                  <h3 className="font-display text-lg font-semibold text-foreground">Nenhuma correção pendente</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Tudo em dia, comandante.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pending.map((s) => (
                  <Card key={s.id} className="hud-corners border-border/70 bg-card/70">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                      <div>
                        <div className="font-display text-base font-semibold text-foreground">{s.project.title}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {s.user.name} · {s.user.email}
                        </div>
                      </div>
                      <Button size="sm" className="gap-1.5" onClick={() => setGrading({ id: s.id, score: "", feedback: "" })}>
                        <ClipboardCheck className="size-3.5" /> Avaliar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Modal submeter */}
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Submeter projeto</h3>
                <p className="mt-1 text-sm text-muted-foreground">{selected.title}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="URL do repositório ou entrega"
                value={form.submissionUrl}
                onChange={(e) => setForm((f) => ({ ...f, submissionUrl: e.target.value }))}
              />
              <Textarea
                placeholder="Descrição da solução (opcional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={submitProject} disabled={actionId === "submit" || !form.submissionUrl.trim()}>
                {actionId === "submit" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submeter
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal avaliar */}
      {grading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold text-foreground">Avaliar submissão</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="font-mono text-[11px] text-muted-foreground" htmlFor="score">Nota (0-100)</label>
                <Input
                  id="score"
                  type="number"
                  min={0}
                  max={100}
                  className="mt-1"
                  value={grading.score}
                  onChange={(e) => setGrading((g) => (g ? { ...g, score: e.target.value } : g))}
                />
              </div>
              <Textarea
                placeholder="Feedback para o aluno"
                value={grading.feedback}
                onChange={(e) => setGrading((g) => (g ? { ...g, feedback: e.target.value } : g))}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={gradeSubmission} disabled={actionId === grading.id}>
                {actionId === grading.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Salvar nota
              </Button>
              <Button variant="outline" onClick={() => setGrading(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-display text-2xl font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  )
}
