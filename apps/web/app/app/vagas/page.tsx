"use client"

import { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Briefcase, MapPin, Search, ChevronRight, Check, Loader2 } from "lucide-react"
import { vagasApi } from "@/lib/api/service"

interface Vaga {
  id: string
  title: string
  description: string | null
  location: string | null
  workMode: string | null
  salaryMin: number | null
  salaryMax: number | null
  seniority: string | null
  skills: Array<{ skillId: string; level: number }> | null
  status: string
  postedAt: string
  organization?: { name: string }
}

export default function VagasPage() {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadVagas = useCallback(async () => {
    try {
      const [data, applications] = await Promise.allSettled([
        vagasApi.list(),
        vagasApi.myApplications(),
      ])
      if (data.status === "fulfilled") setVagas(Array.isArray(data.value) ? data.value : [])
      if (applications.status === "fulfilled") {
        setApplied(new Set(applications.value.map((a) => a.jobId)))
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVagas()
  }, [loadVagas])

  const handleApply = useCallback(async (jobId: string) => {
    setError(null)
    setApplying(jobId)
    try {
      await vagasApi.apply(jobId)
      setApplied((prev) => new Set(prev).add(jobId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a candidatura.")
    } finally {
      setApplying(null)
    }
  }, [])

  const filteredVagas = vagas.filter((v) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      v.title.toLowerCase().includes(term) ||
      v.description?.toLowerCase().includes(term) ||
      v.organization?.name.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Fit-score por IA</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Mural de vagas</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Seu CV é analisado contra cada vaga · easy-apply em um clique
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cargo, empresa ou skill…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando vagas...</div>
      ) : filteredVagas.length === 0 ? (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-8 text-center">
            <Briefcase className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold text-foreground">Nenhuma vaga encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {search ? "Tente outro termo de busca." : "Novas vagas serão adicionadas em breve."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredVagas.map((vaga) => (
            <Card key={vaga.id} className="hud-corners border-border/70 bg-card/70 transition-colors hover:border-primary/30">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid size-11 place-items-center rounded-lg border border-border bg-muted">
                      <Briefcase className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">{vaga.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                        {vaga.organization?.name && <span>{vaga.organization.name}</span>}
                        {vaga.location && (
                          <>
                            <span className="text-border">·</span>
                            <span className="flex items-center gap-1"><MapPin className="size-3" />{vaga.location}</span>
                          </>
                        )}
                        {vaga.workMode && (
                          <>
                            <span className="text-border">·</span>
                            <span>{vaga.workMode}</span>
                          </>
                        )}
                        {vaga.seniority && (
                          <>
                            <span className="text-border">·</span>
                            <span>{vaga.seniority}</span>
                          </>
                        )}
                      </div>
                      {vaga.salaryMin && vaga.salaryMax && (
                        <div className="mt-2 font-mono text-sm font-bold text-primary">
                          R$ {vaga.salaryMin.toLocaleString("pt-BR")} - R$ {vaga.salaryMax.toLocaleString("pt-BR")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {applied.has(vaga.id) ? (
                      <Badge variant="secondary" className="gap-1 px-3 py-1.5 text-accent">
                        <Check className="size-3.5" /> Candidatura enviada
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={applying === vaga.id}
                        onClick={() => handleApply(vaga.id)}
                      >
                        {applying === vaga.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <>Candidatar <ChevronRight className="size-3.5" /></>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {vaga.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{vaga.description}</p>
                )}
                {vaga.skills && vaga.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {vaga.skills.slice(0, 5).map((skill, i) => (
                      <Badge key={i} variant="outline" className="font-mono text-[10px]">
                        Nível {skill.level}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
