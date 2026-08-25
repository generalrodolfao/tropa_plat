"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, LayoutDashboard, BookOpen, Trophy, Briefcase, FileText, Route, Library, Swords, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"

const NAV = [
  { href: "/app", icon: LayoutDashboard, label: "Painel de bordo" },
  { href: "/app/trilhas", icon: BookOpen, label: "Trilhas" },
  { href: "/app/biblioteca", icon: Library, label: "Biblioteca" },
  { href: "/app/hackathons", icon: Trophy, label: "Hackathons" },
  { href: "/app/vagas", icon: Briefcase, label: "Vagas" },
  { href: "/app/pdi", icon: Route, label: "Meu PDI" },
  { href: "/app/cv", icon: FileText, label: "Meu CV" },
  { href: "/app/ligas", icon: Swords, label: "Ligas" },
]

export function AppSidebar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  async function onLogout() {
    await logout()
    router.push("/login")
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? "R"
  const headline = (user as any)?.headline ?? "Soldado"

  return (
    <div className="sticky top-0 flex h-screen flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-5">
        <div className="grid size-9 place-items-center rounded-md border border-primary/40 bg-primary/10">
          <Shield className="size-5 text-primary" />
        </div>
        <div className="leading-none">
          <span className="font-display text-base font-bold tracking-wide text-foreground">
            TROPA<span className="text-primary">DOS</span>DADOS
          </span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">sala de operações</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <item.icon className="size-4 transition-colors group-hover:text-primary" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border/60 p-4">
        <div className="hud-corners rounded-lg border border-border/60 bg-muted/40 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/50 bg-primary/15 font-mono text-sm font-bold text-primary">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{user?.name ?? "Soldado"}</div>
              <div className="truncate font-mono text-[11px] text-accent">{headline}</div>
              <div className="truncate font-mono text-[10px] text-muted-foreground">{user?.email ?? ""}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full gap-2" onClick={onLogout}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </div>
    </div>
  )
}

export function MobileBar() {
  return (
    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="grid size-8 place-items-center rounded-md border border-primary/40 bg-primary/10">
          <Shield className="size-4 text-primary" />
        </div>
        <span className="font-display text-base font-bold tracking-wide text-foreground">
          TROPA<span className="text-primary">DOS</span>DADOS
        </span>
      </div>
      <Button variant="outline" size="icon" aria-label="Abrir menu">
        <Menu className="size-4" />
      </Button>
    </div>
  )
}
