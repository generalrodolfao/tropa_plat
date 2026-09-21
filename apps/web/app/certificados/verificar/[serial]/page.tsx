"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Award,
  Shield,
  ShieldCheck,
  ShieldX,
  Calendar,
  Clock,
  Copy,
  Check,
  Download,
  ChevronLeft,
} from "lucide-react"
import { certificatesApi } from "@/lib/api/service"

interface VerifyResult {
  valid: boolean
  certificate: {
    serial: string
    studentName: string
    title: string
    type: string
    hours: number
    issuedAt: string
    status: string
  }
}

export default function VerificarCertificadoPage() {
  const params = useParams<{ serial: string }>()
  const serial = params.serial as string
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    certificatesApi
      .verify(serial)
      .then((data: VerifyResult) => {
        if (active) setResult(data)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Certificado não encontrado.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [serial])

  const pageUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.href : ""),
    [],
  )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
      <Button asChild variant="ghost" size="sm" className="absolute left-4 top-4 -ml-2 gap-1.5 text-muted-foreground">
        <Link href="/app/certificados">
          <ChevronLeft className="size-4" /> Meus certificados
        </Link>
      </Button>

      <div className="mb-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Verificação de autenticidade</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">Certificado</h1>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">código: {serial}</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Verificando...</div>
      ) : error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-8 text-center">
            <ShieldX className="mx-auto mb-4 size-12 text-destructive" />
            <h3 className="font-display text-lg font-semibold text-destructive">Certificado não encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Não foi possível validar este código. Confira se o link está completo.
            </p>
          </CardContent>
        </Card>
      ) : result ? (
        <>
          <Card className="hud-corners border-border/70 bg-card/70">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl border border-accent/40 bg-accent/10">
                <Award className="size-8 text-accent" />
              </div>

              <Badge
                className={
                  result.valid
                    ? "gap-1 px-3 py-1 font-mono text-[11px]"
                    : "gap-1 border-destructive/50 bg-destructive/10 px-3 py-1 font-mono text-[11px] text-destructive"
                }
              >
                {result.valid ? (
                  <>
                    <ShieldCheck className="size-3" /> Certificado válido
                  </>
                ) : (
                  <>
                    <ShieldX className="size-3" /> Certificado revogado
                  </>
                )}
              </Badge>

              <div className="my-6 border-t border-border/60" />

              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Concedido a
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-foreground">
                {result.certificate.studentName}
              </div>

              <div className="my-5 border-t border-border/60" />

              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Curso / atividade
              </div>
              <div className="mt-1 font-display text-lg font-semibold text-foreground">
                {result.certificate.title}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> Emitido em{" "}
                  {new Date(result.certificate.issuedAt).toLocaleDateString("pt-BR")}
                </span>
                {result.certificate.hours > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" /> {result.certificate.hours}h
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Shield className="size-3.5" /> {result.certificate.serial}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="outline" className="gap-1.5" onClick={copyLink}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Link copiado" : "Compartilhar"}
            </Button>
            <Button className="gap-1.5" onClick={() => window.print()}>
              <Download className="size-4" /> Salvar como PDF
            </Button>
          </div>

          <p className="mt-6 text-center font-mono text-[10px] text-muted-foreground/70">
            Documento emitido por Tropa dos Dados · verificação online via código único.
          </p>
        </>
      ) : null}

      <p className="mt-8 text-center text-xs text-muted-foreground/60">
        <Link href="/" className="hover:text-foreground">
          Tropa dos Dados
        </Link>
      </p>
    </div>
  )
}