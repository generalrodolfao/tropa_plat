"use client"

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, BookMarked, CheckCircle2, Clock, Award, ChevronRight } from "lucide-react";
import { bibliotecaApi } from "@/lib/api/service";
import type { Ebook } from "@/lib/api/client";

export default function BibliotecaPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    bibliotecaApi
      .list()
      .then((data) => {
        if (active) setEbooks(data.ebooks ?? []);
      })
      .catch(() => {
        if (active) setEbooks([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const inProgress = useMemo(() => ebooks.filter((b) => b.status === "lendo"), [ebooks]);
  const done = useMemo(() => ebooks.filter((b) => b.status === "concluido").length, [ebooks]);
  const categories = useMemo(
    () => Array.from(new Set(ebooks.map((b) => b.category))),
    [ebooks],
  );
  const hours = useMemo(
    () => ebooks.reduce((acc, b) => acc + Math.round(b.readPages / 15), 0),
    [ebooks],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Acervo da Tropa</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Biblioteca</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {ebooks.length} ebooks · leitura na plataforma · certificado de horas complementares
          </p>
        </div>
        <div className="hud-corners flex items-center gap-5 rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <Stat label="Ebooks" value={ebooks.length} />
          <Stat label="Lendo" value={inProgress.length} accent />
          <Stat label="Concluídos" value={done} />
          <Stat label="Horas lidas" value={hours} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="hud-corners flex items-center gap-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-accent/40 bg-accent/10">
            <Award className="size-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm font-semibold text-foreground">Horas complementares</div>
            <p className="text-xs text-muted-foreground">
              Cada ebook concluído gera certificado com horas reconhecidas por faculdades.
            </p>
          </div>
          <Link href="/app/biblioteca/certificados">
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              Meus certificados <ChevronRight className="size-3.5" />
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10">
            <BookMarked className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm font-semibold text-foreground">Continue de onde parou</div>
            <p className="text-xs text-muted-foreground">
              {inProgress.length} ebooks em andamento · retomada automática do capítulo.
            </p>
          </div>
          <Link href="#continuar">
            <Button size="sm" className="gap-1.5 shrink-0">
              Retomar <ChevronRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando biblioteca...</div>
      ) : ebooks.length === 0 ? (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-8 text-center">
            <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold text-foreground">Nenhum ebook disponível</h3>
            <p className="mt-2 text-sm text-muted-foreground">Novos títulos serão adicionados em breve.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {inProgress.length > 0 && (
            <section id="continuar">
              <SectionHeader title="Em andamento" count={inProgress.length} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.map((b) => {
                  const pct = b.pages > 0 ? Math.round((b.readPages / b.pages) * 100) : 0;
                  return <EbookCard key={b.id} ebook={b} progress={pct} />;
                })}
              </div>
            </section>
          )}

          <section>
            <SectionHeader title="Todos os ebooks" count={ebooks.length} />
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="px-3 py-1">Todos</Badge>
              {categories.map((c) => (
                <Badge key={c} variant="outline" className="px-3 py-1 font-mono text-[11px]">
                  {c}
                </Badge>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ebooks.map((b) => {
                const pct = b.readPages > 0 ? Math.round((b.readPages / b.pages) * 100) : 0;
                return <EbookCard key={b.id} ebook={b} progress={pct} />;
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-display text-2xl font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      <span className="font-mono text-[11px] text-muted-foreground">{count}</span>
    </div>
  );
}

function EbookCard({ ebook: b, progress }: { ebook: Ebook; progress: number }) {
  const isDone = b.status === "concluido";
  return (
    <Card className={`hud-corners border-border/70 bg-card/70 ${b.status === "lendo" ? "border-primary/40" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted">
              <BookOpen className="size-4 text-primary" />
            </div>
            <Badge variant="secondary" className="px-2 py-0 font-mono text-[10px]">{b.category}</Badge>
          </div>
          {isDone ? (
            <Badge className="gap-1 px-2 py-0 text-[10px] text-accent">
              <CheckCircle2 className="size-3" /> concluído
            </Badge>
          ) : b.status === "lendo" ? (
            <Badge className="px-2 py-0 text-[10px]">lendo</Badge>
          ) : (
            <Badge variant="outline" className="px-2 py-0 text-[10px] text-muted-foreground">novo</Badge>
          )}
        </div>
        <h3 className="mt-3 font-display text-base font-semibold leading-snug text-foreground">{b.title}</h3>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{b.author ?? "Equipe Tropa"}</p>
        <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <Clock className="size-3" /> {b.pages} págs · ~{Math.ceil(b.pages / 15)}h
        </div>
        {progress > 0 && (
          <div className="mt-3">
            <Progress value={progress} className="h-1" indicatorClassName={isDone ? "bg-accent" : "bg-primary"} />
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">{progress}% lido</div>
          </div>
        )}
        <Link href={`/app/biblioteca/${b.slug}`} className="mt-4 block">
          <Button variant={b.status === "lendo" ? "default" : "outline"} size="sm" className="w-full gap-1.5">
            {b.status === "lendo" ? "Continuar leitura" : b.status === "concluido" ? "Reler" : "Começar a ler"}{" "}
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
