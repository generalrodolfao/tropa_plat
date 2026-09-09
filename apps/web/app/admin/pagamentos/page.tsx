"use client"

import { useEffect, useState } from "react"
import { CreditCard, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface Subscription {
  id: string
  status: string
  createdAt: string
  trialEndsAt: string | null
  periodStart: string | null
  periodEnd: string | null
  user: { id: string; name: string; email: string }
  plan: { code: string; name: string; priceCents: number; billingCycle: string }
}

export default function AdminPagamentosPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    loadSubscriptions()
  }, [page, statusFilter])

  async function loadSubscriptions() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/payments/admin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data.items ?? [])
        setTotal(data.total ?? 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const statusColors: Record<string, string> = {
    trialing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    past_due: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    canceled: "bg-red-500/10 text-red-400 border-red-500/20",
  }

  const statusLabels: Record<string, string> = {
    trialing: "Trial",
    active: "Ativa",
    past_due: "Atrasada",
    canceled: "Cancelada",
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Pagamentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Assinaturas e pagamentos dos usuários.</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {["", "trialing", "active", "past_due", "canceled"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => { setStatusFilter(status); setPage(1) }}
            >
              {status === "" ? "Todos" : statusLabels[status] ?? status}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Próximo Pagamento</th>
                  <th className="px-4 py-3 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
                ) : subscriptions.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma assinatura encontrada.</td></tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-foreground">{sub.user.name}</div>
                          <div className="text-xs text-muted-foreground">{sub.user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{sub.plan.name}</div>
                        <div className="text-xs text-muted-foreground">{sub.plan.billingCycle === "annual" ? "Anual" : "Mensal"}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        R$ {(sub.plan.priceCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[sub.status] ?? ""}>
                          {statusLabels[sub.status] ?? sub.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sub.periodEnd
                          ? new Date(sub.periodEnd).toLocaleDateString("pt-BR")
                          : sub.trialEndsAt
                            ? `Trial até ${new Date(sub.trialEndsAt).toLocaleDateString("pt-BR")}`
                            : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages} ({total} assinaturas)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
