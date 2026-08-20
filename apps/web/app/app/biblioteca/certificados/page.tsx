"use client"

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download, Shield, ChevronLeft, FileText, Calendar, Clock } from "lucide-react";
import { READING_CERTIFICATES, LIBRARY_STATS } from "@/lib/mock-inner";

export default function CertificadosPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link href="/app/biblioteca">
            <ChevronLeft className="size-4" /> Biblioteca
          </Link>
        </Button>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>horas complementares</span>
          <span className="text-border">·</span>
          <span>{LIBRARY_STATS.done} ebooks concluídos</span>
        </div>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Comprovante acadêmico</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Meus certificados</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Emitidos automaticamente ao concluir um ebook · validados para horas complementares
        </p>
      </div>

      <div className="hud-corners flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
        <Award className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="text-sm text-muted-foreground">
          Você acumulou <span className="font-semibold text-foreground">{READING_CERTIFICATES.reduce((a, c) => a + c.hours, 0)}h</span>{" "}
          de leitura certificada. Cada certificado tem código de validação único, consultável no portal.
        </p>
      </div>

      <div className="space-y-4">
        {READING_CERTIFICATES.map((c) => (
          <Card key={c.id} className="hud-corners border-border/70 bg-card/70">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-lg border border-accent/40 bg-accent/10">
                  <FileText className="size-5 text-accent" />
                </div>
                <div>
                  <div className="font-display text-base font-semibold text-foreground">{c.ebook}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {c.hours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" /> {c.date}
                    </span>
                    <span>código: TDD-CERT-{c.id.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="gap-1 px-2.5 py-1 font-mono text-[11px]">
                  <Shield className="size-3" /> {c.status}
                </Badge>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download className="size-3.5" /> PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Como funciona a validação
        </div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
            O certificado é gerado somente após 100% das páginas lidas.
          </li>
          <li className="flex items-start gap-2">
            <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
            Cada certificado tem código único verificável (QR + link público).
          </li>
          <li className="flex items-start gap-2">
            <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
            As horas seguem a regra: 1 hora a cada 15 páginas lidas.
          </li>
        </ul>
      </div>
    </div>
  );
}