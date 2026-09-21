"use client"

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Award,
  Clock,
  ArrowRight,
  Highlighter,
  Sparkles,
  Loader2,
  X,
  Trash2,
} from "lucide-react";
import { aiApi, bibliotecaApi } from "@/lib/api/service";
import type { EbookDetail } from "@/lib/api/client";

interface Highlight {
  id: string;
  text: string;
  page: number;
  createdAt: string;
}

const PAGE_TOPICS = [
  "fundamentos e vocabulário essencial",
  "por que isso importa para o negócio",
  "erros comuns de quem está começando",
  "um caso real comentado passo a passo",
  "checklist prático para aplicar hoje",
  "como medir se você está evoluindo",
  "ferramentas recomendadas na prática",
  "conexão com o próximo capítulo",
];

function highlightsKey(slug: string) {
  return `ebookHighlights:${slug}`;
}

function pageContent(title: string, page: number, totalPages: number) {
  const chapter = Math.ceil(page / 10);
  const topic = PAGE_TOPICS[(page - 1) % PAGE_TOPICS.length];
  const isFirstOfChapter = (page - 1) % 10 === 0;
  return {
    chapter,
    isFirstOfChapter,
    topic,
    paragraphs: [
      isFirstOfChapter
        ? `Abrimos o capítulo ${chapter} de "${title}" pelo tema central: ${topic}. Aqui você entende o "porquê" antes do "como", para não decorar sem contexto.`
        : `Seguindo no capítulo ${chapter}, aprofundamos ${topic} com exemplos aplicados ao dia a dia de quem trabalha com dados.`,
      `Na prática (página ${page} de ${totalPages}), imagine uma planilha real da sua empresa. O conceito aparece quando você precisa decidir rápido e com base em evidências — não em achismo.`,
      `Erro clássico: pular direto para a ferramenta e ignorar a pergunta de negócio. Reserve um instante para reformular o problema em uma frase antes de abrir o sandbox.`,
      `Exercício rápido: escreva com suas palavras o que você faria se esse fosse um pedido do seu gestor. Guardar esse trecho ajuda na revisão futura.`,
    ],
  };
}

export default function EbookReaderPage() {
  const { ebook: slug } = useParams<{ ebook: string }>();
  const [book, setBook] = useState<EbookDetail | null>(null);
  const [readPages, setReadPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selection, setSelection] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    bibliotecaApi
      .getEbook(slug)
      .then((data) => {
        if (!active) return;
        setBook(data);
        const initial = data.progress?.readPages ?? data.readPages ?? 0;
        setReadPages(initial);
        setCurrentPage(Math.min(initial + 1, Math.max(1, data.pages)));
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

  // carrega grifos do localStorage
  useEffect(() => {
    if (!slug) return;
    try {
      const raw = localStorage.getItem(highlightsKey(slug));
      setHighlights(raw ? (JSON.parse(raw) as Highlight[]) : []);
    } catch {
      setHighlights([]);
    }
  }, [slug]);

  const persistHighlights = useCallback(
    (next: Highlight[]) => {
      setHighlights(next);
      try {
        localStorage.setItem(highlightsKey(slug), JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [slug],
  );

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

  // avança/volta de página; marca como lido quando avança além do já lido
  const goToPage = useCallback(
    (next: number) => {
      if (!book) return;
      const target = Math.max(1, Math.min(book.pages, next));
      setCurrentPage(target);
      if (target > readPages) {
        void persist(target);
      }
    },
    [book, readPages, persist],
  );

  const captureSelection = useCallback(() => {
    const sel = typeof window !== "undefined" ? window.getSelection() : null;
    const text = sel?.toString().trim() ?? "";
    if (!contentRef.current || !sel || sel.isCollapsed || text.length < 3) {
      setSelection("");
      return;
    }
    const anchor = sel.anchorNode;
    if (anchor && contentRef.current.contains(anchor)) {
      setSelection(text);
    } else {
      setSelection("");
    }
  }, []);

  const addHighlight = () => {
    if (!selection) return;
    const next: Highlight[] = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: selection,
        page: currentPage,
        createdAt: new Date().toISOString(),
      },
      ...highlights,
    ];
    persistHighlights(next);
    setSelection("");
    window.getSelection()?.removeAllRanges();
  };

  const removeHighlight = (id: string) => {
    persistHighlights(highlights.filter((h) => h.id !== id));
  };

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
  const content = pageContent(book.title, currentPage, totalPages);

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
          <span>{readPages}/{totalPages} págs lidas</span>
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
        <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
          <CardContent className="p-6 sm:p-10">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Página {currentPage} de {totalPages}</span>
              <span>capítulo {content.chapter}</span>
            </div>

            <div
              ref={contentRef}
              onMouseUp={captureSelection}
              onKeyUp={captureSelection}
              className="mt-6 space-y-4"
            >
              <h2 className="font-display text-xl font-semibold text-foreground">
                Capítulo {content.chapter} — {content.topic}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {content.paragraphs.map((p, i) => (
                  <p key={i}>
                    {p.split(/(\"[^\"]+\")/).map((chunk, j) =>
                      chunk.startsWith('"') && chunk.endsWith('"') ? (
                        <span key={j} className="text-foreground">{chunk}</span>
                      ) : (
                        <span key={j}>{chunk}</span>
                      ),
                    )}
                  </p>
                ))}
              </div>
            </div>

            {selection && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3">
                <p className="line-clamp-2 max-w-lg text-xs italic text-muted-foreground">
                  “{selection}”
                </p>
                <Button size="sm" className="gap-1.5" onClick={addHighlight}>
                  <Highlighter className="size-3.5" /> Grifar trecho
                </Button>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
              <BookOpen className="size-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                Dica: selecione um trecho com o mouse para grifar e, depois, gerar um resumo de revisão com a IA.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronLeft className="size-4" /> Página anterior
              </Button>
              <span className="font-mono text-[11px] text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              {currentPage >= totalPages ? (
                <Button size="sm" className="gap-1.5" onClick={() => goToPage(totalPages)}>
                  Concluir leitura <CheckCircle2 className="size-3.5" />
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5" onClick={() => goToPage(currentPage + 1)}>
                  Próxima página <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <HighlightsPanel
        highlights={highlights}
        source={book.title}
        onRemove={removeHighlight}
        onClear={() => persistHighlights([])}
      />

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
          {done ? "Marcar como pendente" : "Marcar livro como lido"} <CheckCircle2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function HighlightsPanel({
  highlights,
  source,
  onRemove,
  onClear,
}: {
  highlights: Highlight[]
  source: string
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const [summary, setSummary] = useState<{
    title: string
    summary: string
    keyPoints: string[]
    suggestions: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ordered = useMemo(
    () => [...highlights].sort((a, b) => a.page - b.page),
    [highlights],
  )

  const generateSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await aiApi.summarizeHighlights(
        highlights.map((h) => ({ text: h.text, page: h.page })),
        source,
      )
      setSummary(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar o resumo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hud-corners border-border/70 bg-card/60">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Highlighter className="size-4 text-accent" />
            <span className="font-display text-sm font-semibold text-foreground">
              Meus grifos ({highlights.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {highlights.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onClear}>
                <Trash2 className="size-3.5" /> Limpar
              </Button>
            )}
            <Button
              size="sm"
              className="gap-1.5"
              disabled={loading || highlights.length === 0}
              onClick={generateSummary}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Resumindo...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" /> Gerar resumo com IA
                </>
              )}
            </Button>
          </div>
        </div>

        {highlights.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum trecho grifado ainda. Selecione um texto na página e clique em “Grifar trecho”.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {ordered.map((h) => (
              <li
                key={h.id}
                className="group flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{h.text}</p>
                  <span className="font-mono text-[10px] text-muted-foreground">pág. {h.page}</span>
                </div>
                <button
                  onClick={() => onRemove(h.id)}
                  className="mt-0.5 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Remover grifo"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {summary && (
          <div className="mt-5 rounded-lg border border-accent/40 bg-accent/5 p-4">
            <div className="font-display text-sm font-semibold text-foreground">{summary.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary.summary}</p>
            {summary.keyPoints?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {summary.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            )}
            {summary.suggestions && (
              <p className="mt-3 font-mono text-[11px] text-muted-foreground/80">
                {summary.suggestions}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
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