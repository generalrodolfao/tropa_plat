"use client"

import { useEffect, useState } from "react"
import { Users, BookOpen, CreditCard, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Stats {
  totalUsers: number
  totalCourses: number
  activeSubscriptions: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCourses: 0, activeSubscriptions: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, coursesRes, subsRes] = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/users?limit=1`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/content/courses?limit=1`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/payments/admin/subscriptions?limit=1`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }).then(r => r.json()),
        ])

        setStats({
          totalUsers: usersRes.status === "fulfilled" ? (usersRes.value as any).total ?? 0 : 0,
          totalCourses: coursesRes.status === "fulfilled" ? (coursesRes.value as any).total ?? 0 : 0,
          activeSubscriptions: subsRes.status === "fulfilled" ? (subsRes.value as any).total ?? 0 : 0,
          totalRevenue: 0,
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
    { title: "Usuários", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { title: "Cursos", value: stats.totalCourses, icon: BookOpen, color: "text-green-400" },
    { title: "Assinaturas Ativas", value: stats.activeSubscriptions, icon: CreditCard, color: "text-yellow-400" },
    { title: "Receita Total", value: `R$ ${(stats.totalRevenue / 100).toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
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
          <CardTitle className="text-sm font-medium text-muted-foreground">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma atividade recente para exibir.</p>
        </CardContent>
      </Card>
    </div>
  )
}
