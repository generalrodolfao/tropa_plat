"use client"

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Award, Clock, ArrowRight } from "lucide-react";
import { bibliotecaApi } from "@/lib/api/service";
import type { EbookDetail } from "@/lib/api/client";

export default function EbookReaderPage() {
  const { ebook: slug } = useParams<{ ebook: string }>();
  const [book, setBook] = useState<EbookDetail | null>(null);
  const [readPages, setReadPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    bibliotecaApi
      .getEbook(slug)
      .then((data) => {
        if (!active) return;
        setBook(data);
        setReadPages(data.progress?.readPages ?? data.readPages ?? 0);
      })
      .catch(() => {
        if (active) setBook(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const persist = useCallback(
    async (pages: number) => {
      if (!book) return;
      const capped = Math.max(0, Math.min(book.pages, pages));
      setReadPages(capped);
      setSaving(true);
      try {
        const res = await bibliotecaApi.updateProgress(book.id, capped);
        setBook((prev) =>
          prev ? { ...prev, status: res.status as EbookDetail["status"], readPages: capped } : prev,
        );
      } catch {
        // mantém o valor local; próxima tentativa reconcilia
      } finally {
        setSaving(false);
      }
    },
    [book],
  );

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Carregando ebook...</div>;
  }

  if (!book) {
    return (
      <div className="hud-corners rounded-xl border border-border/60 bg-card/70 p-10 text-center">
        <p className="text-muted-foreground">Ebook não encontrado.</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/app/biblioteca">Voltar para a biblioteca</Link>
        </Button>
      </div>
    );
  }

  const totalPages = book.pages;
  const pct = totalPages > 0 ? Math.min(100, Math.round((readPages / totalPages) * 100)) : 0;
  const done = readPages >= totalPages;
  const estHours = Math.max(0, Math.round(((totalPages - readPages) / 15) * 10) / 10);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link href="/app/biblioteca">
            <ChevronLeft className="size-4" /> Biblioteca
          </Link>
        </Button>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>{book.category}</span>
          <span className="text-border">·</span>
          <span>{readPages}/{totalPages} págs</span>
          {!done && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> ~{estHours}h restantes
              </span>
            </>
          )}
        </div>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">{book.author ?? "Equipe Tropa"}</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">{book.title}</h1>
        <div className="mt-4">
          <Progress value={pct} className="h-1.5" indicatorClassName={done ? "bg-accent" : "bg-primary"} />
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>{pct}% concluído</span>
            <span>{done ? "obra completa" : `+${estHours}h para o certificado`}</span>
          </div>
        </div>
      </div>

      {done ? (
        <CertificateCard title={book.title} hours={Math.max(1, Math.round(totalPages / 15))} />
      ) : (
        <ReaderSection
          readPages={readPages}
          totalPages={totalPages}
          title={book.title}
          onAdvance={(n) => persist(readPages + n)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md font-mono text-[11px] text-muted-foreground">
          {saving ? "Salvando progresso..." : "O progresso de leitura é salvo automaticamente e conta XP ao finalizar."}
        </p>
        <Button
          variant={done ? "outline" : "default"}
          size="sm"
          className="gap-1.5"
          disabled={saving}
          onClick={() => persist(done ? 0 : totalPages)}
        >
          {done ? "Marcar como pendente" : "Marcar como lido"} <CheckCircle2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ReaderSection({
  readPages,
  totalPages,
  title,
  onAdvance,
}: {
  readPages: number
  totalPages: number
  title: string
  onAdvance: (n: number) => void
}) {
  const page = Math.min(readPages + 1, totalPages);
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <CardContent className="p-6 sm:p-10">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Página {page} de {totalPages}</span>
          <span>leitura simulada · capítulo {Math.ceil(page / 10)}</span>
        </div>
        <div className="mt-6 space-y-4">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Capítulo {Math.ceil(page / 10)} — {title}
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Nesta página, o assunto é apresentado de forma direta, com exemplos práticos que você aplica no
              sandbox da plataforma. Sem enrolação: conceito, aplicação e exercício.
            </p>
            <p>
              Para analistas de dados, dominar este tema significa ganhar agilidade no dia a dia e mais confiança
              para resolver problemas reais de negócio — exatamente o que o mercado paga para ver.
            </p>
            <p>
              Ao final do capítulo, você encontra um mini-quiz para fixar o conteúdo e destravar o próximo. Continue
              avançando para completar a leitura e emitir seu certificado de horas complementares.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            <BookOpen className="size-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              Dica: releia as páginas em dúvida — a repetição espaçada aumenta a retenção em até 60%.
            </p>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" disabled={readPages === 0} onClick={() => onAdvance(-1)}>
            <ChevronLeft className="size-4" /> Página anterior
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => onAdvance(1)}>
            Marcar página como lida <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CertificateCard({ title, hours }: { title: string; hours: number }) {
  return (
    <Card className="hud-corners relative overflow-hidden border-accent/40 bg-gradient-to-br from-card via-card to-accent/10">
      <div className="pointer-events-none absolute right-0 top-0 size-56 rounded-full bg-accent/15 blur-3xl" />
      <CardContent className="relative flex flex-col items-center p-8 text-center">
        <div className="grid size-14 place-items-center rounded-full border border-accent/50 bg-accent/15">
          <Award className="size-7 text-accent" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold text-foreground">Leitura concluída!</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Você terminou <span className="font-medium text-foreground">{title}</span>. Já pode emitir o certificado de
          horas complementares para comprovar na sua faculdade.
        </p>
        <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="font-mono text-xl font-bold text-foreground">{hours}h</div>
            <div className="text-xs text-muted-foreground">Horas certificadas</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="font-mono text-xl font-bold text-accent">+120 XP</div>
            <div className="text-xs text-muted-foreground">Recompensa da leitura</div>
          </div>
        </div>
        <Link href="/app/biblioteca/certificados" className="mt-6 w-full max-w-sm">
          <Button className="w-full gap-2">
            Emitir certificado de horas complementares <ArrowRight className="size-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
