"use client"

import { useEffect, useState } from "react"
import { Users, BookOpen, CreditCard, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Stats {
  totalUsers: number
  totalCourses: number
  activeSubscriptions: number
  totalRevenue: number
}

interface RecentUser {
  _id: string
  id?: string
  name?: string
  email?: string
  createdAt?: string
  status?: string
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
}

async function getJson(url: string) {
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

function pick(value: unknown): { total: number; rows: any[] } {
  if (!value || typeof value !== "object") return { total: 0, rows: [] }
  const v = value as any
  const rows = Array.isArray(v) ? v : (v.data ?? v.items ?? v.users ?? v.courses ?? v.subscriptions ?? [])
  return { total: Number(v.total ?? rows.length ?? 0), rows: Array.isArray(rows) ? rows : [] }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCourses: 0, activeSubscriptions: 0, totalRevenue: 0 })
  const [recent, setRecent] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL
    async function load() {
      try {
        const [usersRes, coursesRes, subsRes] = await Promise.allSettled([
          getJson(`${base}/v1/admin/users?limit=8`),
          getJson(`${base}/v1/admin/content/courses?limit=1`),
          getJson(`${base}/v1/payments/admin/subscriptions?limit=100`),
        ])

        const users = usersRes.status === "fulfilled" ? pick(usersRes.value) : { total: 0, rows: [] }
        const courses = coursesRes.status === "fulfilled" ? pick(coursesRes.value) : { total: 0, rows: [] }
        const subs = subsRes.status === "fulfilled" ? pick(subsRes.value) : { total: 0, rows: [] }

        // Soma o valor mensal das assinaturas ativas, quando o backend expõe preço.
        let mrr = 0
        for (const sub of subs.rows) {
          const price =
            sub?.plan?.priceMonthly ?? sub?.plan?.price ?? sub?.amount ?? sub?.priceMonthly ?? 0
          const active = !sub?.status || String(sub.status).toLowerCase().includes("active")
          if (active && typeof price === "number") mrr += price / 100
        }

        setRecent(users.rows.slice(0, 8))
        setStats({
          totalUsers: users.total,
          totalCourses: courses.total,
          activeSubscriptions: subs.total || subs.rows.filter((s: any) => !s?.status || String(s.status).toLowerCase().includes("active")).length,
          totalRevenue: mrr,
        })
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = [
    { title: "Usuários", value: stats.totalUsers.toLocaleString("pt-BR"), icon: Users, color: "text-blue-400" },
    { title: "Cursos", value: stats.totalCourses.toLocaleString("pt-BR"), icon: BookOpen, color: "text-green-400" },
    { title: "Assinaturas Ativas", value: stats.activeSubscriptions.toLocaleString("pt-BR"), icon: CreditCard, color: "text-yellow-400" },
    { title: "MRR (planos ativos)", value: `R$ ${stats.totalRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-primary" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Painel Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral da plataforma Tropa dos Dados.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`size-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? "..." : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Novos recrutas (últimos cadastros)</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cadastro para exibir.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((u) => (
                <div key={u._id ?? u.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-foreground">{u.name ?? "Recruta"}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{u.email}</div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
