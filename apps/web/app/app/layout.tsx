import Link from "next/link";
import { Shield, LayoutDashboard, BookOpen, Swords, Trophy, Briefcase, FileText, Route, Library, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/app", icon: LayoutDashboard, label: "Painel de bordo" },
  { href: "/app/trilhas", icon: BookOpen, label: "Trilhas" },
  { href: "/app/biblioteca", icon: Library, label: "Biblioteca" },
  { href: "/app/hackathons", icon: Trophy, label: "Hackathons" },
  { href: "/app/vagas", icon: Briefcase, label: "Vagas" },
  { href: "/app/pdi", icon: Route, label: "Meu PDI" },
  { href: "/app/cv", icon: FileText, label: "Meu CV" },
  { href: "/app/ligas", icon: Swords, label: "Ligas" },
];

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-border/60 bg-card/40 lg:flex lg:flex-col">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
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
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            sala de operações
          </span>
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
              R
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">Rodolfo</div>
              <div className="font-mono text-[11px] text-accent">Soldado · 1.240 XP</div>
            </div>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
            <div className="h-full w-[49%] rounded-full bg-primary" />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>Recruta</span>
            <span>Próx: Sargento</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileBar() {
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
  );
}