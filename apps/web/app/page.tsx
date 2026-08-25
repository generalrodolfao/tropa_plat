import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Target,
  Swords,
  Trophy,
  Crosshair,
  Route,
  CheckCircle2,
  Flame,
  MapPin,
  ChevronRight,
} from "lucide-react";

const MODOS = [
  {
    icon: Play,
    title: "Aprender assistindo",
    desc: "Aulas gravadas com transcrição clicável, anotações com timestamp e quiz no fim. Assiste no seu ritmo.",
    tag: "MODO A",
  },
  {
    icon: Terminal,
    title: "Aprender fazendo",
    desc: "Sandbox de SQL, Python, R e Excel direto no navegador. Projetos reais corrigidos por mentores.",
    tag: "MODO B",
  },
  {
    icon: Swords,
    title: "Aprender jogando",
    desc: "XP, streaks, ligas semanais e patentes. Cada missão completa te move no ranking do batalhão.",
    tag: "MODO C",
  },
  {
    icon: Route,
    title: "Aprender do seu jeito",
    desc: "O PDI monta sua jornada a partir do seu CV, do seu nível e do seu objetivo. Zero conteúdo aleatório.",
    tag: "MODO D",
  },
];

const PILARES = [
  {
    icon: Trophy,
    title: "Hackathons com prêmio real",
    desc: "Todo trimestre um hackathon patrocinado. O prêmio sai do patrocinador, não do seu bolso.",
  },
  {
    icon: Crosshair,
    title: "Mural de vagas com fit-score",
    desc: "Seu CV é analisado por IA e cada vaga mostra o quanto você está preparado para ela.",
  },
  {
    icon: Shield,
    title: "PDI personalizado",
    desc: "Quizzes adaptativos calibram seu nível. A trilha muda com você, a cada duas semanas.",
  },
];

const PATENTES = ["Recruta", "Soldado", "Sargento", "Tenente", "Comandante"];

export default function LandingPage() {
  return (
    <div className="noise-bg relative flex min-h-screen flex-col">
      <Nav />

      <main className="flex-1">
        <Hero />
        <ModosSection />
        <PilarSection />
        <HackathonSection />
        <PatentesSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-md border border-primary/40 bg-primary/10">
            <Shield className="size-5 text-primary" />
          </div>
          <div className="leading-none">
            <span className="font-display text-lg font-bold tracking-wide text-foreground">
              TROPA<span className="text-primary">DOS</span>DADOS
            </span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              unidade de treinamento
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#modos" className="transition-colors hover:text-foreground">Modos</a>
          <a href="#pilares" className="transition-colors hover:text-foreground">Diferenciais</a>
          <a href="#hackathon" className="transition-colors hover:text-foreground">Hackathons</a>
          <a href="#planos" className="transition-colors hover:text-foreground">Planos</a>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/cadastro">Alistar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="grid-bg relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
      <div className="pointer-events-none absolute -top-32 right-0 size-[480px] rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
        <div>
          <Badge variant="outline" className="mb-6 gap-2 border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Batalhão aberto · turma de agosto
          </Badge>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Aprenda dados.
            <br />
            <span className="text-primary">Do seu jeito.</span>
            <br />
            <span className="text-muted-foreground">Em missão.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            SQL, Python, R e Excel com aulas gravadas, sandbox no navegador, PDI
            personalizado e hackathons com prêmio em dinheiro. Não é uma plataforma
            de vídeos — é um programa de treinamento.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/cadastro">
                <Target className="size-4" />
                Iniciar missão de treinamento
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#modos">Conhecer os modos</Link>
            </Button>
          </div>

          <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              { v: "4 modos", l: "de aprender" },
              { v: "100%", l: "prática real" },
              { v: "R$ 5k+", l: "em prêmios/ano" },
            ].map((s) => (
              <div key={s.l} className="hud-corners rounded-md border border-border/60 bg-card/60 p-3">
                <div className="font-mono text-xl font-bold text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <MissionPreview />
      </div>
    </section>
  );
}

function MissionPreview() {
  return (
    <div className="relative">
      <div className="hud-corners rounded-xl border border-border/70 bg-card/70 p-5 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-primary" />
            <span className="font-mono text-xs font-semibold tracking-wide text-foreground">
              OFENSIVA DO DIA
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">SEX 19 AGO</span>
        </div>

        <ul className="divide-y divide-border/50">
          {[
            { tag: "ASSISTIR", t: "Limpando o terreno com AND/OR/NOT", xp: "+45 XP", done: true },
            { tag: "PRATICAR", t: "Sandbox: filtrar a base de vendas", xp: "+80 XP" },
            { tag: "REVISAR", t: "Quiz de WHERE · repetição espaçada", xp: "+30 XP" },
            { tag: "HACKATHON", t: "Apoiar o time na fase 2 do churn", xp: "+120 XP" },
          ].map((m) => (
            <li key={m.t} className="flex items-center gap-3 py-3">
              <div className={`grid size-6 shrink-0 place-items-center rounded-full border ${m.done ? "border-accent/60 bg-accent/10" : "border-border bg-muted"}`}>
                {m.done ? (
                  <CheckCircle2 className="size-4 text-accent" />
                ) : (
                  <span className="font-mono text-[10px] text-muted-foreground">{m.xp.slice(0, 2)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-widest text-primary">{m.tag}</span>
                <span className="block truncate text-sm text-foreground">{m.t}</span>
              </div>
              <span className="font-mono text-xs font-semibold text-primary">{m.xp}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-lg border border-border/60 bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">XP total</span>
            <span className="font-mono text-sm font-bold text-primary">1.240 / 2.500</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full w-[49%] rounded-full bg-primary" />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>Soldado</span>
            <span>Sargento</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-6 -left-6 -z-10 size-40 rounded-full bg-accent/10 blur-3xl" />
    </div>
  );
}

function ModosSection() {
  return (
    <section id="modos" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="mb-12 max-w-2xl">
        <Badge variant="outline" className="mb-4 font-mono text-[11px] uppercase tracking-widest text-primary">
          04 modos de operação
        </Badge>
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Cada soldado treina do seu jeito.
        </h2>
        <p className="mt-4 text-muted-foreground">
          A Tropa dos Dados não te obriga a um formato único. Você alterna entre os modos
          conforme seu momento — e o PDI equilibra o resto.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODOS.map((m, i) => (
          <div
            key={m.title}
            className="group hud-corners relative rounded-xl border border-border/70 bg-card/60 p-5 transition-all hover:border-primary/50 hover:bg-card"
            style={{ transitionDelay: `${i * 30}ms` }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="grid size-11 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                <m.icon className="size-5 text-primary" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{m.tag}</span>
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">{m.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PilarSection() {
  return (
    <section id="pilares" className="border-y border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-3">
        {PILARES.map((p) => (
          <div key={p.title} className="flex gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10">
              <p.icon className="size-6 text-accent" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HackathonSection() {
  return (
    <section id="hackathon" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="hud-corners relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-8 sm:p-12">
        <div className="pointer-events-none absolute right-0 top-0 size-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Badge className="mb-5 gap-2 border-primary/50 bg-primary/15 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
              <Trophy className="size-3.5" />
              Hackathon trimestral
            </Badge>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              Coloque a mão na massa — e leve prêmio pra casa.
            </h2>
            <p className="mt-5 max-w-xl text-muted-foreground">
              Empresas reais patrocinam os desafios: eles pagam o prêmio, você resolve o
              problema. É portfolio, é networking e é dinheiro — tudo de uma vez.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {["Equipes de até 4", "Júri de empresas", "Prêmio em Pix", "Certificado + badges"].map((f) => (
                <Badge key={f} variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <CheckCircle2 className="size-3.5 text-accent" />
                  {f}
                </Badge>
              ))}
            </div>
            <Button asChild size="lg" className="mt-8 gap-2">
              <Link href="/login">
                Ver o desafio aberto
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/60 p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Desafio ativo</span>
              <span className="font-mono text-[11px] font-bold text-primary">FASE 2 · ABERTO</span>
            </div>
            <div className="py-5">
              <div className="font-display text-xl font-semibold text-foreground">Previsão de churn</div>
              <p className="mt-1 text-sm text-muted-foreground">Dataset de telecom · 50 mil linhas</p>
              <div className="mt-5 flex items-end gap-1">
                {[35, 55, 40, 70, 60, 85, 75, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-primary/20" style={{ height: `${h * 0.6}px` }}>
                    <div className="h-full w-full rounded-sm bg-primary/70" style={{ height: `${h * 0.4}px` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
              <div>
                <div className="font-mono text-lg font-bold text-primary">R$ 5.000</div>
                <div className="text-xs text-muted-foreground">Prêmio total</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-foreground">12 dias</div>
                <div className="text-xs text-muted-foreground">Prazo final</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PatentesSection() {
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-4 font-mono text-[11px] uppercase tracking-widest text-primary">
            Progressão de patente
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Cada XP te move na hierarquia.
          </h2>
        </div>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {PATENTES.map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <div className="hud-corners flex min-w-32 flex-col items-center gap-2 rounded-lg border border-border/70 bg-background/50 px-5 py-4">
                <div className={`grid size-8 place-items-center rounded-full border ${i <= 1 ? "border-primary/60 bg-primary/15" : "border-border bg-muted"}`}>
                  <span className={`font-mono text-[10px] font-bold ${i <= 1 ? "text-primary" : "text-muted-foreground"}`}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <span className={`font-display text-sm font-semibold ${i <= 1 ? "text-foreground" : "text-muted-foreground"}`}>{p}</span>
              </div>
              {i < PATENTES.length - 1 && <ChevronRight className="size-4 shrink-0 text-border" />}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center font-mono text-xs text-muted-foreground">
          PROMOÇÃO AUTOMÁTICA · LIGAS SEMANAIS · BADGES POR CONQUISTA
        </p>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="grid-bg hud-corners relative overflow-hidden rounded-2xl border border-border/70 p-10 text-center sm:p-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative">
          <Badge className="mb-5 font-mono text-[11px] uppercase tracking-widest text-primary">Sem teste gratuito de fachada</Badge>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            Sua primeira missão começa agora.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Monte seu PDI em 5 minutos, execute a ofensiva do dia e veja sua patente subir.
            7 dias de trial com cartão — cancele quando quiser.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/cadastro">Alistar-se na Tropa</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Ver planos</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />100% PT-BR</span>
            <span className="flex items-center gap-1.5"><Shield className="size-3.5" />Dados protegidos</span>
            <span className="flex items-center gap-1.5"><Target className="size-3.5" />Pix + cartão</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-md border border-primary/40 bg-primary/10">
            <Shield className="size-4 text-primary" />
          </div>
          <div className="leading-none">
            <span className="font-display text-base font-bold tracking-wide text-foreground">
              TROPA<span className="text-primary">DOS</span>DADOS
            </span>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          © 2026 Tropa dos Dados · Unidade de treinamento em dados
        </p>
      </div>
    </footer>
  );
}

function Play(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 3 14 9-14 9V3Z" />
    </svg>
  );
}

function Terminal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m4 17 6-6-6-6" />
      <path d="M12 19h8" />
    </svg>
  );
}