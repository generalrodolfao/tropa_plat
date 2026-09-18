"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Users,
  Flame,
  Award,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  CalendarClock,
  ArrowUpRight,
  Wallet,
} from "lucide-react"
import {
  empresaDemo,
  empresaKpisDemo,
  engajamentoSemanal,
  consumoMensal,
  turmasDemo,
  membrosDemo,
  fmtBRL,
} from "@/lib/demo-data"

const statusTurma: Record<TurmaBadge, { label: string; cls: string }> = {
  ativa: { label: "Ativa", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  a_iniciar: { label: "A iniciar", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  concluida: { label: "Concluída", cls: "bg-muted text-muted-foreground border-border" },
}
type TurmaBadge = (typeof turmasDemo)[number]["status"] | string

function LineChart() {
  const w = 560
  const h = 180
  const vals = engajamentoSemanal.map((w) => w.hours)
  const max = Math.max(...vals) * 1.1
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (w - 40) + 20, h - 24 - (v / max) * (h - 40)])
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${h - 24} L${pts[0][0].toFixed(1)},${h - 24} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="20" x2={w - 20} y1={24 + (h - 48) * f} y2={24 + (h - 48) * f} stroke="hsl(var(--border))" strokeDasharray="4 6" />
      ))}
      <path d={area} fill="url(#engGrad)" />
      <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" className="fill-primary" stroke="hsl(var(--background))" strokeWidth="1.5" />
      ))}
      {engajamentoSemanal.map((wk, i) =>
        i % 2 === 0 ? (
          <text key={wk.week} x={pts[i][0]} y={h - 6} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="9">
            {wk.week}
          </text>
        ) : null
      )}
    </svg>
  )
}

function Alerts() {
  const atRisk = membrosDemo.filter((m) => m.status === "risco_evasao")
  const ready = membrosDemo.filter((m) => m.status === "pronto_promocao")
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="hud-corners border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <AlertTriangle className="size-4 text-yellow-400" /> Risco de evasão ({atRisk.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {atRisk.map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-lg border border-yellow-500/15 bg-yellow-500/5 px-3 py-2">
              <div>
                <div className="text-sm font-medium text-foreground">{m.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{m.role} · sem acessar há {m.streak === 0 ? "7+ dias" : `${m.streak}d`}</div>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">nudge automático</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="hud-corners border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <UserCheck className="size-4 text-green-400" /> Prontos para o próximo passo ({ready.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ready.map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-lg border border-green-500/15 bg-green-500/5 px-3 py-2">
              <div>
                <div className="text-sm font-medium text-foreground">{m.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{m.role} · score {m.diagnostic}→{m.certification}</div>
              </div>
              <Badge className="font-mono text-[10px]">elegível a promoção</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmpresaPage() {
  const kpis = empresaKpisDemo
  const utilization = Math.round((kpis.seatsUsed / kpis.seatsTotal) * 100)
  const maxHours = useMemo(() => consumoMensal[consumoMensal.length - 1].custo, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary">
            <Building2 className="size-3.5" /> Tropa Corporativa
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
            {empresaDemo.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <span>{empresaDemo.plan}</span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1"><CalendarClock className="size-3" /> renovação 01/03/2027</span>
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-primary/5 px-3 py-1.5 font-mono text-[11px] text-accent">
          <Wallet className="size-3.5" /> {fmtBRL(kpis.mrr)} / mês
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Seats ativos", value: `${kpis.seatsUsed}/${kpis.seatsTotal}`, sub: `${utilization}% de utilização`, icon: Users },
          { label: "Engajamento médio", value: `${kpis.avgStreak} dias`, sub: "ofensiva média", icon: Flame },
          { label: "Progresso médio", value: `${kpis.avgProgress}%`, sub: "nas trilhas atribuídas" },
          { label: "Certificados no mês", value: String(kpis.certificatesThisMonth), sub: "+38% vs. mês anterior", icon: Award },
        ].map((c) => (
          <Card key={c.label} className="hud-corners border-border/70 bg-card/70">
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {c.label}
                {c.icon && <c.icon className="size-4 text-primary" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">{c.value}</div>
              <div className="mt-1 font-mono text-[10px] text-accent">{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
        Modo demonstração · dados de uso simulados para apresentação. Conectar à v1 de eventos corporativos quando disponível.
      </div>

      <Tabs defaultValue="engajamento">
        <TabsList>
          <TabsTrigger value="engajamento">Engajamento & consumo</TabsTrigger>
          <TabsTrigger value="competencias">Matriz de competência</TabsTrigger>
        </TabsList>

        <TabsContent value="engajamento" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card className="hud-corners border-border/70 bg-card/70">
              <CardHeader>
                <CardTitle className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Horas de estudo por semana · últimas 12 semanas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart />
              </CardContent>
            </Card>
            <Card className="hud-corners border-border/70 bg-card/70">
              <CardHeader>
                <CardTitle className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Consumo de seats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consumoMensal.map((m) => (
                  <div key={m.mes}>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">{m.mes}</span>
                      <span className="text-foreground">{m.seats} seats · {fmtBRL(m.custo)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                        style={{ width: `${(m.custo / maxHours) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border/60 pt-2 font-mono text-[10px] text-muted-foreground">
                  <span>utilização</span>
                  <span className="text-accent">{utilization}% · 16 seats disponíveis</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <Alerts />
        </TabsContent>

        <TabsContent value="competencias" className="mt-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Matriz de competência · temperatura das skills do time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="py-2 pr-4">Soldado</th>
                      {["SQL", "Qlik", "Python", "Estatística", "Storytelling"].map((s) => (
                        <th key={s} className="py-2 pr-4">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {membrosDemo.map((m) => (
                      <tr key={m.name} className="border-b border-border/30">
                        <td className="py-2.5 pr-4">
                          <div className="font-medium text-foreground">{m.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{m.role}</div>
                        </td>
                        {m.skills.map((s) => (
                          <td key={s.name} className="py-2 pr-4">
                            <span
                              className="inline-block w-14 rounded-md px-2 py-1 text-center font-mono text-[10px] font-bold"
                              style={{
                                background: `hsl(var(--primary) / ${s.level / 130})`,
                                color: s.level > 60 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                                border: "1px solid hsl(var(--border) / 0.6)",
                              }}
                            >
                              {s.level}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Turmas</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            gestão · mentoria · prazos
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {turmasDemo.map((t) => (
            <Link key={t.id} href={`/app/empresa/turmas/${t.id}`}>
              <Card className="hud-corners h-full border-border/70 bg-card/70 transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-foreground">{t.name}</CardTitle>
                    <Badge variant="outline" className={`shrink-0 font-mono text-[10px] ${statusTurma[t.status].cls}`}>
                      {statusTurma[t.status].label}
                    </Badge>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">{t.dept} · mentor {t.mentor}</div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="font-mono text-[11px] text-accent">{t.trail}</div>
                  <div>
                    <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                      <span>{t.seatsUsed}/{t.seatsTotal} seats</span>
                      <span>{t.avgProgress}% concluído</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${t.avgProgress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      <CalendarClock className="size-3" /> {t.nextSession}
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
