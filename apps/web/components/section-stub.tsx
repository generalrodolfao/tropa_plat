import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon, Trophy, Briefcase, Route, FileText, Swords, ArrowUpRight, ChevronRight } from "lucide-react";

const SECTIONS = {
  hackathons: {
    icon: Trophy,
    title: "Centro de operações de hackathon",
    desc: "Desafios patrocinados com prêmio em dinheiro. Equipes, jurados de empresas e placar ao vivo.",
    bullets: ["Próximo desafio: Previsão de churn", "Prêmio total: R$ 5.000", "Prazo: 12 dias"],
  },
  vagas: {
    icon: Briefcase,
    title: "Mural de vagas com fit-score",
    desc: "Vagas de dados reais com análise do seu CV por IA — cada vaga mostra o quão preparado você está.",
    bullets: ["Fit-score calculado por IA", "Easy-apply em um clique", "Notificações de vaga compatível"],
  },
  pdi: {
    icon: Route,
    title: "Plano de Desenvolvimento Individual",
    desc: "Sua jornada personalizada, montada a partir do seu CV, do seu nível e do seu objetivo de carreira.",
    bullets: ["Quiz adaptativo calibra seu nível", "Atualizado a cada 2 semanas", "Gap de skills mapeado"],
  },
  cv: {
    icon: FileText,
    title: "Revisão de CV com IA",
    desc: "Upload do seu CV, análise por rubrica e feedback PT-BR por seção. Score 0–100 estilo ATS.",
    bullets: ["Score por seção + sugestões", "Cache de 30 dias (sem re-billing)", "Privacidade LGPD"],
  },
  ligas: {
    icon: Swords,
    title: "Batalhões semanais",
    desc: "Ligas de 30–50 soldados. Top 15% sobe de liga, quem dorme no ponto cai.",
    bullets: ["Promoção: top 15%", "Rebaixamento: últimos 15%", "Placar ao vivo"],
  },
} as const;

type SectionKey = keyof typeof SECTIONS;

export default function SectionStub({ section }: { section: SectionKey }) {
  const s = SECTIONS[section];
  const Icon = s.icon as LucideIcon;

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-3 font-mono text-[11px] uppercase tracking-widest text-primary">
          {section}
        </Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{s.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{s.desc}</p>
      </div>

      <Card className="hud-corners border-border/70 bg-card/70">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
          <div className="grid-bg relative flex min-h-56 items-center justify-center rounded-xl border border-border/60">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-card" />
            <div className="grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10">
              <Icon className="size-8 text-primary" />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <ul className="space-y-2.5">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-accent" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2.5">
              <Button className="gap-1.5">
                <ArrowUpRight className="size-4" /> Explorar agora
              </Button>
              <Button asChild variant="outline">
                <Link href="/app">Voltar ao painel</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="font-mono text-[11px] text-muted-foreground">
        EM CONSTRUÇÃO · MÓDULO CHEGA NA FASE v1 DA SPEC
      </p>
    </div>
  );
}