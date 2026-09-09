"use client"

import { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Swords, ArrowUpRight, ArrowDownRight, Minus, Crown, Shield, Medal } from "lucide-react"
import { ligasApi, gamificationApi } from "@/lib/api/service"

interface LeagueMember {
  userId: string
  name: string
  xp: number
  rank: number
}

interface League {
  id: string
  season: number
  weekStart: string
  weekEnd: string
  status: string
  rankings: LeagueMember[]
}

const RANK_LADDER = [
  { title: "Recruta", min: 0, icon: Shield },
  { title: "Soldado", min: 500, icon: Shield },
  { title: "Cabo", min: 1500, icon: Shield },
  { title: "Sargento", min: 3000, icon: Medal },
  { title: "Tenente", min: 6000, icon: Medal },
  { title: "Capitão", min: 10000, icon: Crown },
  { title: "Major", min: 20000, icon: Crown },
  { title: "General", min: 50000, icon: Crown },
]

function currentRank(xp: number) {
  let current = RANK_LADDER[0]
  let next = RANK_LADDER[1]
  for (let i = 0; i < RANK_LADDER.length; i++) {
    if (xp >= RANK_LADDER[i].min) {
      current = RANK_LADDER[i]
      next = RANK_LADDER[i + 1] ?? RANK_LADDER[i]
    }
  }
  const progress = next.min > current.min
    ? Math.min(100, ((xp - current.min) / (next.min - current.min)) * 100)
    : 100
  return { current, next, progress }
}

export default function LigasPage() {
  const [league, setLeague] = useState<League | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [leagueData, summaryData] = await Promise.allSettled([
        ligasApi.getLeague(),
        gamificationApi.getSummary(),
      ])

      if (leagueData.status === "fulfilled") {
        setLeague(leagueData.value as unknown as League)
      }
      if (summaryData.status === "fulfilled") {
        setSummary(summaryData.value)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const xp = summary?.totalXp ?? 0
  const { current, next, progress } = currentRank(xp)
  const members = league?.rankings ?? []
  const promotion = Math.ceil(members.length * 0.15)
  const relegation = Math.ceil(members.length * 0.15)

  const userRank = members.findIndex((m) => m.userId === summary?.userId) + 1

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Batalhão semanal</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Ligas</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {league
              ? `Semana ${league.weekStart} - ${league.weekEnd} · ${members.length} soldados no batalhão`
              : "Nenhuma liga ativa"}
          </p>
        </div>
        <div className="hud-corners flex items-center gap-5 rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Sua posição</div>
            <div className="font-display text-2xl font-bold text-primary">{userRank > 0 ? `${userRank}º` : "—"}</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Patente</div>
            <div className="font-display text-2xl font-bold text-foreground">{current.title}</div>
          </div>
          <div className="w-24">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Próx: {next.title}</div>
            <Progress value={progress} className="mt-2 h-1.5" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="ranking">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="patentes">Patentes</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="mt-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Carregando ranking...</div>
              ) : members.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhum membro na liga.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">#</th>
                        <th className="px-4 py-3 font-medium">Soldado</th>
                        <th className="px-4 py-3 font-medium text-right">XP</th>
                        <th className="px-4 py-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => {
                        const isPromotion = i < promotion
                        const isRelegation = i >= members.length - relegation
                        return (
                          <tr key={m.userId} className="border-b border-border/30 hover:bg-muted/30">
                            <td className="px-4 py-3 font-mono text-muted-foreground">{m.rank}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="grid size-8 place-items-center rounded-full border border-primary/50 bg-primary/15 font-mono text-xs font-bold text-primary">
                                  {m.name.charAt(0)}
                                </div>
                                <span className="font-medium text-foreground">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-primary">{m.xp.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                              {isPromotion ? (
                                <Badge className="gap-1 bg-green-500/10 text-green-400 border-green-500/20">
                                  <ArrowUpRight className="size-3" /> Promoção
                                </Badge>
                              ) : isRelegation ? (
                                <Badge className="gap-1 bg-red-500/10 text-red-400 border-red-500/20">
                                  <ArrowDownRight className="size-3" /> Rebaixamento
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <Minus className="size-3" /> Estável
                                </Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patentes" className="mt-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-5">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Escala de patentes
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {RANK_LADDER.map((rank) => {
                  const Icon = rank.icon
                  const isCurrent = current.title === rank.title
                  return (
                    <div
                      key={rank.title}
                      className={`rounded-lg border p-4 ${
                        isCurrent
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/60 bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`size-5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`font-display text-sm font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                          {rank.title}
                        </span>
                      </div>
                      <div className="mt-2 font-mono text-xs text-muted-foreground">
                        {rank.min.toLocaleString()} XP mínimo
                      </div>
                      {isCurrent && (
                        <Badge className="mt-2 gap-1 bg-primary/15 text-primary border-primary/30">
                          <Crown className="size-3" /> Sua patente
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras" className="mt-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-5 space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Regras da liga semanal
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Top 15%</strong> são promovidos para a liga superior na próxima semana.</p>
                <p><strong className="text-foreground">Bottom 15%</strong> são rebaixados para a liga inferior.</p>
                <p>O restante permanece na mesma liga.</p>
                <p>O XP é calculado entre segunda-feira e domingo.</p>
                <p>Streaks dão bônus de XP: +10% com 3 dias, +25% com 7 dias, +50% com 14 dias.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
