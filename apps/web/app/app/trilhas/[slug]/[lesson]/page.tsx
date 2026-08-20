import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Terminal, Brain, Swords, ChevronLeft, CheckCircle2, Bookmark, Captions } from "lucide-react";
import { COURSES } from "@/lib/mock-data";

export default async function LessonPage({ params }: PageProps<"/app/trilhas/[slug]/[lesson]">) {
  const { slug, lesson: lessonId } = await params;
  const course = COURSES.find((c) => c.slug === slug);
  if (!course) notFound();

  const lesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
  if (!lesson) notFound();
  if (lesson.locked) notFound();

  const parentModule = course.modules.find((m) => m.lessons.some((l) => l.id === lessonId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link href={`/app/trilhas/${slug}`}>
            <ChevronLeft className="size-4" /> {course.title}
          </Link>
        </Button>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>{parentModule?.codename}</span>
          <span className="text-border">·</span>
          <span>{lesson.durationMin} min</span>
          <Badge variant="secondary" className="px-2 py-0 text-[10px]">+{lesson.xp} XP</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <LessonContent type={lesson.type} />
          <CompleteBar />
        </div>

        <div className="space-y-4">
          <LessonOutline course={course} currentId={lessonId} />
          <TranscriptCard />
        </div>
      </div>
    </div>
  );
}

function LessonContent({ type }: { type: string }) {
  if (type === "sandbox") return <SandboxMock />;
  if (type === "quiz") return <QuizMock />;
  if (type === "project") return <ProjectMock />;
  return <VideoMock />;
}

function VideoMock() {
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <div className="relative aspect-video grid-bg bg-muted/40">
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="grid size-20 place-items-center rounded-full border border-primary/50 bg-primary/15 shadow-[0_0_60px_-10px] shadow-primary/50">
              <Play className="size-9 fill-primary text-primary" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold text-foreground">Player de vídeo</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                Cloudflare Stream · HLS · reprodução adaptativa
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-border/50 bg-background/80 px-4 py-2 backdrop-blur">
          <span className="font-mono text-[11px] text-muted-foreground">00:00</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div className="h-full w-[8%] rounded-full bg-primary" />
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">12:41</span>
          <Badge variant="secondary" className="px-2 py-0 text-[10px]">720p</Badge>
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Limpando o terreno com AND/OR/NOT</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Nesta missão você aprende a combinar condições e desmontar consultas complexas
            em blocos simples. Transcrição disponível abaixo do vídeo, com anotações por timestamp.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["#WHERE", "#AND", "#OR", "#NOT", "#SQL"].map((t) => (
            <Badge key={t} variant="outline" className="font-mono text-[11px]">{t}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SandboxMock() {
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-accent" />
          <span className="font-mono text-xs font-semibold text-foreground">sandbox.sql — DuckDB-WASM</span>
        </div>
        <Badge variant="secondary" className="px-2 py-0 font-mono text-[10px]">roda no navegador</Badge>
      </div>

      <div className="p-5 font-mono text-sm">
        <div className="mb-3 flex items-start gap-2">
          <span className="mt-1 font-mono text-xs text-muted-foreground">tabela:</span>
          <span className="rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">vendas (1.000 linhas · parquet via CDN)</span>
        </div>
        <div className="space-y-1.5">
          {["-- Filtre vendas > R$ 500 no estado de SP", "SELECT", "  vendedor,", "  SUM(valor) AS total", "FROM vendas", "WHERE", "  estado = 'SP'", "  AND valor > 500", "GROUP BY vendedor", "ORDER BY total DESC", "LIMIT 5;"].map((line, i) => (
            <div key={i} className={`flex gap-3 ${i > 1 ? "text-foreground/90" : "text-muted-foreground"}`}>
              <span className="w-6 shrink-0 text-right text-muted-foreground/50">{i + 1}</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" className="gap-1.5">
            <Play className="size-3.5" /> Executar
          </Button>
          <Button size="sm" variant="outline">Reiniciar</Button>
        </div>
        <div className="mt-4 rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent">saída · 5 linhas</div>
          <pre className="mt-2 overflow-x-auto text-xs text-foreground">{`vendedor      total
────────────── ───────
Ana Souza     12.450
Carlos Lima   9.870
Beatriz Reis  7.215`}</pre>
        </div>
      </div>
    </Card>
  );
}

function QuizMock() {
  const questions = [
    { q: "Qual operador combina duas condições que devem ser VERDADEIRAS ao mesmo tempo?", options: ["OR", "AND", "NOT", "LIKE"] },
  ];
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-sky-400" />
          <span className="font-mono text-xs font-semibold text-foreground">quiz adaptativo · IRT</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">6 perguntas · ~5 min</span>
      </div>

      <CardContent className="space-y-5 p-5">
        <div>
          <div className="mb-1 flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>PERGUNTA 1 DE 6</span>
            <span className="text-primary">+30 XP</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-border">
            <div className="h-full w-1/6 rounded-full bg-primary" />
          </div>
        </div>

        <h2 className="font-display text-lg font-semibold text-foreground">{questions[0].q}</h2>

        <div className="grid gap-2">
          {questions[0].options.map((o, i) => (
            <button
              key={o}
              type="button"
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border font-mono text-[11px] text-muted-foreground">
                {["A", "B", "C", "D"][i]}
              </span>
              {o}
            </button>
          ))}
        </div>

        <Button size="lg" className="w-full gap-2">
          Confirmar resposta <CheckCircle2 className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ProjectMock() {
  return (
    <Card className="hud-corners overflow-hidden border-border/70 bg-card/70">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <Swords className="size-4 text-amber-400" />
        <span className="font-mono text-xs font-semibold text-foreground">projeto · correção por mentor + auto-teste</span>
      </div>
      <CardContent className="space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold text-foreground">Analisar vendas por região</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use o dataset de vendas para montar uma análise por região e responder: qual região
          cresceu mais no último trimestre? Submeta sua query SQL e o auto-teste valida; um mentor
          revisa o raciocínio.
        </p>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <div className="font-mono text-xs text-muted-foreground">Área de submissão</div>
          <Button className="mt-3 gap-2">
            <Bookmark className="size-4" /> Submeter projeto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompleteBar() {
  return (
    <div className="hud-corners flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Estado da missão</div>
        <div className="text-sm font-medium text-foreground">Execute esta missão para ganhar XP e liberar a próxima</div>
      </div>
      <Button size="lg" className="gap-2">
        Concluir missão <CheckCircle2 className="size-4" />
      </Button>
    </div>
  );
}

function LessonOutline({ course, currentId }: { course: (typeof COURSES)[0]; currentId: string }) {
  const all = course.modules.flatMap((m) => m.lessons);
  return (
    <Card className="hud-corners border-border/70 bg-card/70">
      <CardContent className="p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Missões da trilha
        </div>
        <ul className="space-y-1">
          {all.map((l) => (
            <li key={l.id}>
              <Link
                href={l.locked ? "#" : `/app/trilhas/${course.slug}/${l.id}`}
                aria-disabled={l.locked}
                className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  l.id === currentId
                    ? "bg-primary/10 font-medium text-primary"
                    : l.completed
                      ? "text-muted-foreground hover:bg-muted/50"
                      : l.locked
                        ? "cursor-not-allowed text-muted-foreground/40"
                        : "text-foreground hover:bg-muted/50"
                }`}
              >
                {l.completed ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-accent" />
                ) : l.locked ? (
                  <Lock className="size-3.5 shrink-0" />
                ) : (
                  <Play className="size-3.5 shrink-0" />
                )}
                <span className="truncate">{l.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TranscriptCard() {
  return (
    <Card className="hud-corners border-border/70 bg-card/70">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Captions className="size-3.5" /> Transcrição
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">busca fulltext</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          [00:12] — Quando você combina condições, pense em AND como um portão que exige
          as duas chaves ao mesmo tempo... <span className="text-primary">[01:58]</span> já OR
          aceita qualquer uma delas. Vamos praticar no sandbox...
        </p>
      </CardContent>
    </Card>
  );
}

function Lock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}