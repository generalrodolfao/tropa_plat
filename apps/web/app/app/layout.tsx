import Link from "next/link"
import { Shield } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { AppSidebar, MobileBar } from "@/components/app-sidebar"

const NAV = [
  { href: "/app", label: "Painel de bordo" },
  { href: "/app/trilhas", label: "Trilhas" },
  { href: "/app/biblioteca", label: "Biblioteca" },
  { href: "/app/hackathons", label: "Hackathons" },
  { href: "/app/vagas", label: "Vagas" },
  { href: "/app/pdi", label: "Meu PDI" },
  { href: "/app/cv", label: "Meu CV" },
  { href: "/app/ligas", label: "Ligas" },
]

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <AuthGuard>
      <div className="grid min-h-screen bg-background lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-border/60 bg-card/40 lg:flex lg:flex-col">
          <AppSidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
