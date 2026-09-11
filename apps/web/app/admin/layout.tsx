"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, LayoutDashboard, BookOpen, Users, CreditCard, Video, Brain, Trophy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { useAuthStore } from "@/store/authStore"

const ADMIN_NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/cursos", icon: BookOpen, label: "Cursos" },
  { href: "/admin/quizzes", icon: Brain, label: "Quizzes" },
  { href: "/admin/hackathons", icon: Trophy, label: "Hackathons" },
  { href: "/admin/usuarios", icon: Users, label: "Usuários" },
  { href: "/admin/videos", icon: Video, label: "Vídeos" },
  { href: "/admin/pagamentos", icon: CreditCard, label: "Pagamentos" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const isAdmin = user?.roles?.includes("admin")

  if (!isAdmin) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <Shield className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h1 className="font-display text-xl font-bold text-foreground">Acesso Restrito</h1>
            <p className="mt-2 text-sm text-muted-foreground">Você não tem permissão de administrador.</p>
            <Link href="/app">
              <Button className="mt-4" variant="outline">
                <ArrowLeft className="mr-2 size-4" /> Voltar ao Painel
              </Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="grid min-h-screen bg-background lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-border/60 bg-card/40 lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-5">
            <div className="grid size-9 place-items-center rounded-md border border-primary/40 bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <div className="leading-none">
              <span className="font-display text-base font-bold tracking-wide text-foreground">
                TROPA<span className="text-primary">DOS</span>DADOS
              </span>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">admin</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {ADMIN_NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border/60 p-4">
            <Link href="/app">
              <Button variant="ghost" size="sm" className="w-full gap-2">
                <ArrowLeft className="size-4" /> Voltar ao Painel
              </Button>
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
