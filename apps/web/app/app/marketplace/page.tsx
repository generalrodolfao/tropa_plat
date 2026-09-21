"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, X } from "lucide-react"
import {
  Store,
  Clock,
  Star,
  Users2,
  ChevronRight,
  ShieldCheck,
  Layers,
} from "lucide-react"
import { parceirosCursosDemo, servicosParceirosDemo, fmtBRL } from "@/lib/demo-data"
import type { ServicoParceiro, ParceiroCurso } from "@/lib/demo-data"

export default function MarketplacePage() {
  const [course, setCourse] = useState<ParceiroCurso | null>(null)
  const [service, setService] = useState<ServicoParceiro | null>(null)
  const [interest, setInterest] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem("marketplaceInterests")
      if (raw) setInterest(JSON.parse(raw))
    } catch {
      // ignora
    }
  }, [])

  function registerInterest(id: string) {
    const next = { ...interest, [id]: new Date().toISOString() }
    setInterest(next)
    try {
      localStorage.setItem("marketplaceInterests", JSON.stringify(next))
    } catch {
      // ignora
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary">
            <Store className="size-3.5" /> Marketplace de talento em dados
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Marketplace</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Trilhas oficiais de parceiros e projetos reais para analistas certificados da Tropa
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-primary/5 px-3 py-1.5 font-mono text-[11px] text-accent">
          <ShieldCheck className="size-3.5" /> parceiros verificados
        </Badge>
      </div>

      <Tabs defaultValue="cursos">
        <TabsList variant="line" className="w-full justify-start gap-6 rounded-none border-b border-border/60 bg-transparent px-0 pb-1">
          <TabsTrigger value="cursos">Cursos de parceiros</TabsTrigger>
          <TabsTrigger value="servicos">Serviços &amp; projetos</TabsTrigger>
        </TabsList>

        <TabsContent value="cursos" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {parceirosCursosDemo.map((c) => (
              <Card key={c.id} className="hud-corners h-full border-border/70 bg-card/70 transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] text-accent">
                      {c.partnerTicker}
                    </Badge>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      <Star className="size-3 text-yellow-400" /> {c.rating}
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">{c.title}</CardTitle>
                  <div className="font-mono text-[10px] text-muted-foreground">{c.partner}</div>
                </CardHeader>
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="font-mono text-[11px] text-primary">{c.especialidade}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {c.hours}h</span>
                    <span className="flex items-center gap-1"><Users2 className="size-3" /> {c.students.toLocaleString("pt-BR")} alunos</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="font-display text-lg font-bold text-primary">{fmtBRL(c.price)}</span>
                      <Button size="sm" variant="secondary" className="gap-1.5 font-mono text-[11px]" onClick={() => setCourse(c)}>
                      Inscrever <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="mt-4">
          <div className="space-y-3">
            {servicosParceirosDemo.map((s) => (
              <Card key={s.id} className="hud-corners border-border/70 bg-card/70 transition-colors hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] text-accent">PROJETO</Badge>
                        <span className="font-mono text-[10px] text-muted-foreground">{s.partner}</span>
                      </div>
                      <h3 className="mt-1.5 font-display text-base font-semibold text-foreground">{s.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {s.days} dias</span>
                        <span className="flex items-center gap-1"><Layers className="size-3" /> {s.slots} vaga(s)</span>
                        <span>{s.tier}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-primary">{fmtBRL(s.earnings)}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">fee plataforma {s.serviceFeePct}%</div>
                      <div className="mt-1 font-mono text-[10px] text-accent">{s.deadline}</div>
                      <Button size="sm" className="mt-2 font-mono text-[11px]" onClick={() => setService(s)}>Solicitar</Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.skills.map((k) => (
                      <Badge key={k} variant="outline" className="font-mono text-[10px]">{k}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {course && (
        <InterestModal
          title={course.title}
          eyebrow="Curso de parceiro"
          meta={[
            `parceiro: ${course.partner}`,
            `${course.hours}h de conteúdo`,
            `${course.students.toLocaleString("pt-BR")} alunos`,
            `avaliação ${course.rating}/5`,
            course.especialidade,
          ]}
          actionLabel="Confirmar interesse"
          interested={Boolean(interest[course.id])}
          onConfirm={() => registerInterest(course.id)}
          onClose={() => setCourse(null)}
        />
      )}

      {service && (
        <InterestModal
          title={service.title}
          eyebrow="Serviço & projeto"
          meta={[
            `empresa: ${service.partner}`,
            `perfil ${service.tier}`,
            `${service.slots} vaga(s)`,
            `${service.days} dias`,
            `remuneração ${fmtBRL(service.earnings)}`,
            `fee plataforma ${service.serviceFeePct}%`,
          ]}
          actionLabel="Enviar solicitação"
          interested={Boolean(interest[service.id])}
          onConfirm={() => registerInterest(service.id)}
          onClose={() => setService(null)}
        />
      )}
    </div>
  )
}

function InterestModal({
  title,
  eyebrow,
  meta,
  actionLabel,
  interested,
  onConfirm,
  onClose,
}: {
  title: string
  eyebrow: string
  meta: string[]
  actionLabel: string
  interested: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{eyebrow}</p>
            <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <ul className="mt-4 space-y-2 font-mono text-[11px] text-muted-foreground">
          {meta.map((m) => (
            <li key={m} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-primary" /> {m}
            </li>
          ))}
        </ul>
        {interested ? (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-foreground">
            <CheckCircle2 className="size-4 shrink-0 text-accent" /> Interesse registrado. A empresa parceira será notificada.
          </div>
        ) : (
          <Button className="mt-6 w-full gap-2" onClick={onConfirm}>
            <CheckCircle2 className="size-4" /> {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
