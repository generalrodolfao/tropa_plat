"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Flame, TrendingUp, Download, CalendarClock, User } from "lucide-react"
import { turmasDemo, membrosDemo } from "@/lib/demo-data"

const SKILL_NAMES = ["SQL", "Qlik", "Python", "Estatística", "Storytelling"]

const statusCls: Record<string, string> = {
  no_ritmo: "bg-muted text-muted-foreground border-border",
  risco_evasao: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  pronto_promocao: "bg-green-500/10 text-green-400 border-green-500/20",
}
const statusLabel: Record<string, string> = {
  no_ritmo: "No ritmo",
  risco_evasao: "Risco de evasão",
  pronto_promocao: "Pronto p/ promoção",
}

function RadarChart({ skills }: { skills: Array<{ name: string; level: number }> }) {
  const size = 240
  const c = size / 2
  const r = size / 2 - 42
  const axes = skills.length
  const angle = (i: number) => (Math.PI * 2 * i) / axes - Math.PI / 2
  const pt = (i: number, f: number) => [c + Math.cos(angle(i)) * r * f, c + Math.sin(angle(i)) * r * f]

  const rings = [0.25, 0.5, 0.75, 1]
  const area = skills.map((s, i) => pt(i, s.level / 100).join(",")).join(" ")

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-60">
      {rings.map((f) => (
        <polygon
          key={f}
          points={skills.map((_, i) => pt(i, f).join(",")).join(" ")}
          fill="none"
          stroke="hsl(var(--border))"
          strokeDasharray={f < 1 ? "3 5" : undefined}
        />
      ))}
      {skills.map((_, i) => {
        const [x, y] = pt(i, 1)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="hsl(var(--border))" />
      })}
      <polygon points={area} fill="hsl(var(--primary) / 0.18)" stroke="hsl(var(--primary))" strokeWidth="2" />
      {skills.map((s, i) => {
        const [x, y] = pt(i, s.level / 100)
        const [lx, ly] = pt(i, 1.18)
        return (
          <g key={s.name}>
            <circle cx={x} cy={y} r="4" className="fill-primary" stroke="hsl(var(--background))" strokeWidth="1.5" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground font-mono" fontSize="10">
              {s.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function TurmaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const turma = turmasDemo.find((t) => t.id === id) ?? turmasDemo[0]
  const [selected, setSelected] = useState(membrosDemo[0])

  const headerStats = useMemo(() => {
    const aderencia = Math.round((turma.seatsUsed / Math.max(turma.seatsTotal, 1)) * 100)
    return [
      { label: "Aderência dos seats", value: `${aderencia}%` },
      { label: "Progresso médio", value: `${turma.avgProgress}%` },
      { label: "Ofensiva média", value: `${turma.avgStreak} dias` },
    ]
  }, [turma])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="mb-2 gap-1.5 px-2 font-mono text-[11px]" asChild>
            <Link href="/app/empresa"><ArrowLeft className="size-3.5" /> Voltar ao painel</Link>
          </Button>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{turma.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <span>{turma.dept}</span>
            <span className="text-border">·</span>
            <span>{turma.trail}</span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1"><User className="size-3" /> mentor {turma.mentor}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1.5 bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
            <CalendarClock className="size-3.5" /> {turma.nextSession}
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5 font-mono text-[11px]">
            <Download className="size-3.5" /> Relatório CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {headerStats.map((s) => (
          <Card key={s.label} className="hud-corners border-border/70 bg-card/70">
            <CardContent className="pt-0.5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-display text-2xl font-bold text-foreground">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="hud-corners border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Roster da turma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-2.5">Soldado</th>
                    <th className="px-4 py-2.5">Progresso</th>
                    <th className="px-4 py-2.5 text-right">Ofensiva</th>
                    <th className="px-4 py-2.5 text-center">Diagnóstico → Certificação</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {membrosDemo.map((m) => (
                    <tr
                      key={m.name}
                      onClick={() => setSelected(m)}
                      className="cursor-pointer border-b border-border/30 transition-colors hover:bg-muted/40 data-[sel=true]:bg-primary/10"
                      data-sel={selected.name === m.name}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground">{m.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{m.role}</div>
                      </td>
                      <td className="w-40 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={m.progress} className="h-1.5 flex-1" />
                          <span className="font-mono text-[10px] text-muted-foreground">{m.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        <span className="inline-flex items-center gap-1 text-accent"><Flame className="size-3" />{m.streak}d</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {m.diagnostic} → <span className="font-bold text-primary">{m.certification}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className={`font-mono text-[9px] ${statusCls[m.status]}`}>
                          {statusLabel[m.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="hud-corners h-fit border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Radar de competências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="grid size-12 place-items-center rounded-full border border-primary/50 bg-primary/15 font-mono text-lg font-bold text-primary mx-auto">
                {selected.name.charAt(0)}
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">{selected.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground">{selected.role} · {selected.xp.toLocaleString()} XP</div>
            </div>
            <div className="mt-2">
              <RadarChart skills={selected.skills} />
            </div>
            <div className="space-y-1.5 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><TrendingUp className="size-3" /> score diagnóstico</span>
                <span className="text-muted-foreground">score certificação</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="font-bold text-muted-foreground">{selected.diagnostic}</span>
                <span className="text-border">→</span>
                <span className="font-bold text-primary">{selected.certification}</span>
                <span className="text-[10px] text-accent">+{Math.max(selected.certification - selected.diagnostic, 0)} pts · ROI do treinamento</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">Comparações geradas do PDI + quizzes IA</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
