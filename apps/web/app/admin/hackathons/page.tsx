"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trophy, Plus, Loader2, AlertTriangle } from "lucide-react"
import { adminApi } from "@/lib/api/service"

interface HackathonAdmin {
  id: string
  title: string
  theme: string | null
  status: string
  prizePoolCents: number
  maxTeamSize: number
  _count?: { teams: number; submissions: number }
}

const STATUSES = ["draft", "open", "running", "closed"]

export default function AdminHackathonsPage() {
  const [items, setItems] = useState<HackathonAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", theme: "", prize: 0, maxTeamSize: 4 })

  const load = useCallback(async () => {
    try {
      const data = await adminApi.listHackathons()
      setItems(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function create() {
    if (!form.title.trim()) {
      setError("Informe o título.")
      return
    }
    setError(null)
    setAction("create")
    try {
      await adminApi.createHackathon({
        title: form.title.trim(),
        theme: form.theme.trim() || undefined,
        prizePoolCents: Math.round(Number(form.prize) * 100),
        maxTeamSize: Number(form.maxTeamSize) || 4,
      })
      setForm({ title: "", theme: "", prize: 0, maxTeamSize: 4 })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar.")
    } finally {
      setAction(null)
    }
  }

  async function setStatus(id: string, status: string) {
    setAction(id)
    try {
      await adminApi.updateHackathonStatus(id, status)
      await load()
    } catch {
      // ignore
    } finally {
      setAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Conteúdo</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Hackathons</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{items.length} hackathons</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" /> {error}
        </div>
      )}

      <Card className="hud-corners border-border/70 bg-card/70">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Plus className="size-3.5" /> Novo hackathon
          </div>
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_120px_120px_auto]">
            <Input placeholder="Título" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Input placeholder="Tema" value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))} />
            <Input type="number" placeholder="Prêmio (R$)" value={form.prize} onChange={(e) => setForm((f) => ({ ...f, prize: Number(e.target.value) }))} />
            <Input type="number" placeholder="Time máx." value={form.maxTeamSize} onChange={(e) => setForm((f) => ({ ...f, maxTeamSize: Number(e.target.value) }))} />
            <Button onClick={create} disabled={action === "create"}>
              {action === "create" ? <Loader2 className="size-4 animate-spin" /> : "Criar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {items.map((h) => (
            <Card key={h.id} className="hud-corners border-border/70 bg-card/70">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                    <Trophy className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold text-foreground">{h.title}</div>
                    <div className="mt-0.5 flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
                      {h.theme && <span>{h.theme}</span>}
                      <span>R$ {(h.prizePoolCents / 100).toLocaleString("pt-BR")}</span>
                      {h._count && <span>· {h._count.teams} equipes · {h._count.submissions} submissões</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">{h.status}</Badge>
                  {action === h.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <select
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                      value={h.status}
                      onChange={(e) => setStatus(h.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Nenhum hackathon cadastrado.</p>}
        </div>
      )}
    </div>
  )
}
