"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Flame, Trophy, Loader2, CheckCircle2, Award, Save } from "lucide-react"
import { authApi, gamificationApi } from "@/lib/api/service"
import { useAuthStore } from "@/store/authStore"

interface BadgeItem {
  code: string
  name: string
  description: string | null
  icon: string | null
  earned: boolean
  earnedAt: string | null
}

interface RankItem {
  title: string
  xp: number
}

export default function PerfilPage() {
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({ name: "", headline: "", bio: "", linkedinUrl: "", githubUrl: "" })
  const [summary, setSummary] = useState<any>(null)
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [ranks, setRanks] = useState<RankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        headline: user.headline ?? "",
        bio: "",
        linkedinUrl: "",
        githubUrl: "",
      })
    }
  }, [user])

  useEffect(() => {
    ;(async () => {
      try {
        const [s, b, r] = await Promise.allSettled([
          gamificationApi.getSummary(),
          gamificationApi.getBadges(),
          gamificationApi.getRanks(),
        ])
        if (s.status === "fulfilled") setSummary(s.value)
        if (b.status === "fulfilled") setBadges(Array.isArray(b.value) ? b.value : [])
        if (r.status === "fulfilled") setRanks(Array.isArray(r.value) ? r.value : [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const updated = await authApi.updateMe({
        name: form.name,
        headline: form.headline || undefined,
        bio: form.bio || undefined,
        linkedinUrl: form.linkedinUrl || undefined,
        githubUrl: form.githubUrl || undefined,
      })
      setUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.")
    } finally {
      setSaving(false)
    }
  }

  const earned = badges.filter((b) => b.earned).length
  const totalXp = summary?.totalXp ?? 0

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Ficha do soldado</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Perfil</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="hud-corners border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="font-display text-base">Dados do operador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="Analista de Dados | SQL & Python"
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Conte sua trajetória em dados..."
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input id="github" value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
              <Button className="gap-2" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-accent">
                  <CheckCircle2 className="size-4" /> Salvo
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              Email: {user?.email} · Objetivo: {user?.careerGoal ?? "—"}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Flame className="size-4 text-primary" /> Progresso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Patente</span>
                <span className="font-display font-bold text-foreground">{summary?.rank ?? "Recruta"}</span>
              </div>
              <div>
                <div className="mb-1 flex justify-between font-mono text-[11px] text-muted-foreground">
                  <span>{totalXp} XP</span>
                  <span>{summary?.nextRank ?? "—"}</span>
                </div>
                <Progress value={summary?.rankProgress ?? 0} className="h-1.5" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-muted-foreground">Streak</span>
                <span className="font-mono text-sm text-foreground">{summary?.streak ?? 0} dias</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hud-corners border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Award className="size-4 text-accent" /> Conquistas ({earned}/{badges.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : badges.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma badge cadastrada.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {badges.map((b) => (
                    <div
                      key={b.code}
                      className={`rounded-lg border p-3 text-center ${b.earned ? "border-accent/40 bg-accent/5" : "border-border/60 bg-muted/20 opacity-60"}`}
                    >
                      <div className="text-xl">{b.earned ? "🏅" : "🔒"}</div>
                      <div className="mt-1 text-xs font-medium text-foreground">{b.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {ranks.length > 0 && (
            <Card className="hud-corners border-border/70 bg-card/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Trophy className="size-4 text-primary" /> Patentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {ranks.map((r) => {
                  const reached = totalXp >= r.xp
                  return (
                    <div key={r.title} className="flex items-center justify-between text-sm">
                      <span className={reached ? "text-foreground" : "text-muted-foreground"}>{r.title}</span>
                      <Badge variant={reached ? "secondary" : "outline"} className="font-mono text-[10px]">
                        {r.xp} XP
                      </Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
