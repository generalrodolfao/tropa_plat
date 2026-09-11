"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trophy, Users, Calendar, ChevronRight, CircleDot, Medal, Plus, LogIn, Send, CheckCircle2, Loader2, AlertTriangle } from "lucide-react"
import { hackathonsApi } from "@/lib/api/service"
import { useAuthStore } from "@/store/authStore"

interface Hackathon {
  id: string
  title: string
  theme: string | null
  status: string
  startAt: string | null
  endAt: string | null
  submissionDeadline: string | null
  prizePoolCents: number
  maxTeamSize: number
  teams: Array<{ id: string; name: string; _count: { members: number } }>
  prizes: Array<{ position: number; amountCents: number; description: string | null }>
}

interface MyTeamMembership {
  id: string
  teamId: string
  role: string
  team: { id: string; name: string; hackathonId: string; hackathon: { id: string; title: string } }
}

interface Submission {
  id: string
  userId: string
  teamId: string | null
  title: string
  status: string
  repoUrl: string | null
  demoUrl: string | null
}

const PHASES = [
  { n: "1", label: "Inscrição", desc: "Forme equipe de até 4 e escolha o dataset" },
  { n: "2", label: "Modelagem", desc: "Desenvolva a solução e faça submissões" },
  { n: "3", label: "Apresentação", desc: "Top 3 times apresentam para o júri" },
  { n: "4", label: "Premiação", desc: "Prêmio pago via Pix na semana seguinte" },
]

export default function HackathonsPage() {
  const { user } = useAuthStore()
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [myTeams, setMyTeams] = useState<MyTeamMembership[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitForm, setSubmitForm] = useState({ title: "", repoUrl: "", demoUrl: "", description: "" })
  const [now, setNow] = useState<number | null>(null)

  const active = hackathons.find((h) => h.status === "running" || h.status === "open")
  const upcoming = hackathons.filter((h) => h.status === "draft")
  const closed = hackathons.filter((h) => h.status === "closed")

  const activeId = active?.id

  const loadHackathons = useCallback(async () => {
    try {
      const [list, teams] = await Promise.allSettled([hackathonsApi.list(), hackathonsApi.myTeams()])
      if (list.status === "fulfilled") setHackathons(Array.isArray(list.value) ? list.value : [])
      if (teams.status === "fulfilled") setMyTeams(Array.isArray(teams.value) ? teams.value : [])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSubmissions = useCallback(async (hackathonId: string) => {
    try {
      const data = await hackathonsApi.submissions(hackathonId)
      setSubmissions(Array.isArray(data) ? data : [])
    } catch {
      setSubmissions([])
    }
  }, [])

  useEffect(() => {
    loadHackathons()
  }, [loadHackathons])

  useEffect(() => {
    setNow(Date.now())
  }, [])

  useEffect(() => {
    if (activeId) loadSubmissions(activeId)
  }, [activeId, loadSubmissions])

  const myTeam = activeId ? myTeams.find((m) => m.team.hackathonId === activeId) : undefined
  const mySubmission = user ? submissions.find((s) => s.userId === user.id) : undefined

  async function run(id: string, fn: () => Promise<unknown>, after?: () => Promise<void>) {
    setError(null)
    setActionId(id)
    try {
      await fn()
      if (after) await after()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a ação.")
    } finally {
      setActionId(null)
    }
  }

  async function createTeam(hackathonId: string) {
    if (!teamName.trim()) return
    await run(
      "create-team",
      () => hackathonsApi.createTeam(hackathonId, teamName.trim()),
      async () => {
        setShowCreateTeam(false)
        setTeamName("")
        await loadHackathons()
      },
    )
  }

  async function joinTeam(teamId: string) {
    await run(teamId, () => hackathonsApi.joinTeam(teamId), loadHackathons)
  }

  async function submitProject() {
    if (!activeId || !submitForm.title.trim()) return
    await run(
      "submit",
      () =>
        hackathonsApi.submit({
          hackathonId: activeId,
          title: submitForm.title.trim(),
          repoUrl: submitForm.repoUrl.trim() || undefined,
          demoUrl: submitForm.demoUrl.trim() || undefined,
          description: submitForm.description.trim() || undefined,
        }),
      async () => {
        setShowSubmit(false)
        setSubmitForm({ title: "", repoUrl: "", demoUrl: "", description: "" })
        await loadSubmissions(activeId)
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Centro de operações</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Hackathons</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Desafios patrocinados com prêmio em dinheiro · o sponsor paga, você resolve
          </p>
        </div>
        <Button className="gap-2" onClick={() => active && setShowCreateTeam(true)} disabled={!active}>
          <CircleDot className="size-4" /> Inscrever nova equipe
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando hackathons...</div>
      ) : active ? (
        <section className="hud-corners relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1.5 border-primary/50 bg-primary/15 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  Desafio ativo
                </Badge>
                <Badge variant="secondary" className="px-2.5 py-1 font-mono text-[11px]">
                  {active.status === "open" ? "Inscrições abertas" : "Em andamento"}
                </Badge>
              </div>

              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {active.title}
              </h2>
              {active.theme && (
                <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">{active.theme}</p>
              )}

              <div className="mt-6 grid max-w-lg grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                  <div className="font-mono text-xl font-bold text-primary">
                    R$ {(active.prizePoolCents / 100).toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs text-muted-foreground">Prêmio total</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                  <div className="font-mono text-xl font-bold text-foreground">
                    {active.endAt && now
                      ? `${Math.max(0, Math.ceil((new Date(active.endAt).getTime() - now) / (1000 * 60 * 60 * 24)))} dias`
                      : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Prazo final</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                  <div className="font-mono text-xl font-bold text-foreground">Até {active.maxTeamSize}</div>
                  <div className="text-xs text-muted-foreground">Por equipe</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {myTeam ? (
                  <Badge variant="secondary" className="gap-1 px-3 py-1.5 text-accent">
                    <CheckCircle2 className="size-3.5" /> Sua equipe: {myTeam.team.name}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Entre em uma equipe ou crie a sua para participar.
                  </span>
                )}
                {myTeam && (mySubmission ? (
                  <Badge className="gap-1 px-3 py-1.5">
                    <CheckCircle2 className="size-3.5" /> Projeto submetido
                  </Badge>
                ) : (
                  <Button size="sm" className="gap-1.5" onClick={() => setShowSubmit(true)}>
                    <Send className="size-3.5" /> Submeter projeto
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="hud-corners rounded-xl border border-border/60 bg-background/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    <Users className="size-3.5" /> Equipes inscritas
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{active.teams.length} equipes</span>
                </div>
                <div className="mt-3 space-y-2">
                  {active.teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma equipe inscrita ainda. Crie a primeira!</p>
                  ) : (
                    active.teams.slice(0, 5).map((team) => {
                      const isMine = myTeam?.teamId === team.id
                      const full = team._count.members >= active.maxTeamSize
                      return (
                        <div key={team.id} className="flex items-center gap-2.5">
                          <div className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 font-mono text-[10px] font-semibold text-primary">
                            {team.name.charAt(0)}
                          </div>
                          <span className="truncate text-sm text-foreground">{team.name}</span>
                          <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">{team._count.members} membros</span>
                          {!myTeam && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 shrink-0 gap-1 px-2 text-xs"
                              disabled={full || actionId === team.id}
                              onClick={() => joinTeam(team.id)}
                            >
                              {actionId === team.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <LogIn className="size-3" />
                              )}
                              {full ? "Cheia" : "Entrar"}
                            </Button>
                          )}
                          {isMine && <Badge variant="secondary" className="px-2 py-0 text-[10px]">você</Badge>}
                        </div>
                      )
                    })
                  )}
                </div>
                {!myTeam && (
                  <Button variant="outline" size="sm" className="mt-4 w-full gap-1.5" onClick={() => setShowCreateTeam(true)}>
                    <Plus className="size-3.5" /> Criar equipe
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-8 text-center">
            <Trophy className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold text-foreground">Nenhum hackathon ativo</h3>
            <p className="mt-2 text-sm text-muted-foreground">Fique de olho nos próximos desafios!</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="fases">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="fases">Como funciona</TabsTrigger>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="fases" className="mt-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-5">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Ciclo de um hackathon
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PHASES.map((p) => (
                  <div key={p.n} className="relative rounded-lg border border-border/60 bg-muted/20 p-4">
                    <div className="mb-3">
                      <span className="font-mono text-xs font-bold text-primary">Fase {p.n}</span>
                    </div>
                    <div className="font-display text-sm font-semibold text-foreground">{p.label}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                <Trophy className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  O prêmio é pago pelo <span className="font-medium text-foreground">patrocinador</span>, nunca pela
                  plataforma. Estruturação legal de <span className="font-medium text-foreground">concurso cultural</span> —
                  regulamento aprovado e divulgado antes da abertura.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proximos" className="mt-4">
          {upcoming.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">Nenhum hackathon programado.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map((h) => (
                <HackathonCard key={h.id} h={h} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          {closed.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">Nenhum hackathon encerrado.</p>
          ) : (
            <div className="space-y-3">
              {closed.map((h) => (
                <Card key={h.id} className="hud-corners border-border/70 bg-card/70">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-4">
                      <div className="grid size-11 place-items-center rounded-lg border border-border bg-muted">
                        <Medal className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-display text-base font-semibold text-foreground">{h.title}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {h.teams.length} equipes participaram
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="px-2.5 py-1 font-mono text-[11px]">
                      Encerrado
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal criar equipe */}
      {showCreateTeam && active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold text-foreground">Criar Equipe</h3>
            <p className="mt-1 text-sm text-muted-foreground">Hackathon: {active.title}</p>
            <Input
              className="mt-4"
              placeholder="Nome da equipe"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={() => createTeam(active.id)} disabled={actionId === "create-team"}>
                {actionId === "create-team" ? <Loader2 className="size-4 animate-spin" /> : "Criar"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateTeam(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal submeter projeto */}
      {showSubmit && active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold text-foreground">Submeter projeto</h3>
            <p className="mt-1 text-sm text-muted-foreground">Hackathon: {active.title}</p>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Título do projeto"
                value={submitForm.title}
                onChange={(e) => setSubmitForm((f) => ({ ...f, title: e.target.value }))}
              />
              <Input
                placeholder="URL do repositório (opcional)"
                value={submitForm.repoUrl}
                onChange={(e) => setSubmitForm((f) => ({ ...f, repoUrl: e.target.value }))}
              />
              <Input
                placeholder="URL da demo (opcional)"
                value={submitForm.demoUrl}
                onChange={(e) => setSubmitForm((f) => ({ ...f, demoUrl: e.target.value }))}
              />
              <Textarea
                placeholder="Descrição da solução (opcional)"
                value={submitForm.description}
                onChange={(e) => setSubmitForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={submitProject} disabled={actionId === "submit" || !submitForm.title.trim()}>
                {actionId === "submit" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submeter
              </Button>
              <Button variant="outline" onClick={() => setShowSubmit(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HackathonCard({ h }: { h: Hackathon }) {
  return (
    <Card className="hud-corners border-border/70 bg-card/70">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Badge variant="outline" className="gap-1 px-2.5 py-1 font-mono text-[11px] text-primary">
            <Calendar className="size-3" /> {h.teams.length} equipes
          </Badge>
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">{h.title}</h3>
        {h.theme && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{h.theme}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-primary">
            R$ {(h.prizePoolCents / 100).toLocaleString("pt-BR")}
          </span>
          <Button size="sm" className="gap-1.5">
            Ver detalhes <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
