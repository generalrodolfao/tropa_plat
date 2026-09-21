"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Award,
  Shield,
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  Download,
  Share2,
  Check,
  Link2,
  Loader2,
  FileUp,
} from "lucide-react"
import { certificatesApi } from "@/lib/api/service"

interface Certificate {
  id: string
  type: string
  title: string
  hours: number | null
  serial: string
  issuedAt: string
  status: string
}

const TYPE_LABEL: Record<string, string> = {
  course: "Curso",
  reading: "Leitura",
  hackathon: "Hackathon",
  external: "Externo",
}

const VERIFY_PATH = "/certificados/verificar/"

export default function CertificadosPage() {
  const [items, setItems] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copyId, setCopyId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    certificatesApi
      .my()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const totalHours = items.reduce((acc, c) => acc + (c.hours ?? 0), 0)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      await certificatesApi.upload(file)
      load()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Falha ao enviar certificado.")
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (c: Certificate) => {
    try {
      await certificatesApi.download(c.id, `${c.serial}.pdf`)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Falha ao baixar o PDF.")
      setTimeout(() => setUploadError(null), 4000)
    }
  }

  const handleShare = async (c: Certificate) => {
    const url = `${window.location.origin}${VERIFY_PATH}${c.serial}`
    try {
      await navigator.clipboard.writeText(url)
      setCopyId(c.id)
      setTimeout(() => setCopyId(null), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Comprovantes</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Meus certificados</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Emitidos ao concluir cursos, leituras e hackathons · validados por código único
          </p>
        </div>
        <div className="hud-corners flex items-center gap-5 rounded-lg border border-border/70 bg-card/70 px-4 py-3">
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-foreground">{items.length}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Certificados</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-accent">{totalHours}h</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Horas</div>
          </div>
        </div>
      </div>

      {/* Upload externo */}
      <Card className="hud-corners border-dashed border-accent/40 bg-accent/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg border border-accent/40 bg-accent/10">
              <FileUp className="size-5 text-accent" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-foreground">
                Subir certificado externo
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                Diploma, curso presencial, workshop... em PDF, para centralizar na sua porta.
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={uploading}
            onClick={() => uploadRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <FileUp className="size-4" /> Enviar arquivo
              </>
            )}
          </Button>
          <input
            ref={uploadRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
              e.target.value = ""
            }}
          />
        </CardContent>
      </Card>

      {uploadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {uploadError}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando certificados...</div>
      ) : items.length === 0 ? (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-8 text-center">
            <Award className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold text-foreground">Nenhum certificado ainda</h3>
            <p className="mt-2 text-sm text-muted-foreground">Conclua uma trilha, ebook ou hackathon para emitir.</p>
            <Button asChild variant="outline" className="mt-4 gap-1.5">
              <Link href="/app/trilhas">
                Ver trilhas <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id} className="hud-corners border-border/70 bg-card/70">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-lg border border-accent/40 bg-accent/10">
                    <FileText className="size-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-display text-base font-semibold text-foreground">{c.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                      <Badge variant="secondary" className="px-2 py-0 font-mono text-[10px]">
                        {TYPE_LABEL[c.type] ?? c.type}
                      </Badge>
                      {c.hours != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {c.hours}h
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" /> {new Date(c.issuedAt).toLocaleDateString("pt-BR")}
                      </span>
                      <span>código: {c.serial}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="gap-1 px-2.5 py-1 font-mono text-[11px]">
                    <Shield className="size-3" /> {c.status === "issued" ? "válido" : c.status}
                  </Badge>
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link href={`${VERIFY_PATH}${c.serial}`}>
                      <Link2 className="size-3.5" /> Verificar
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleShare(c)}>
                    {copyId === c.id ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
                    {copyId === c.id ? "Link copiado!" : "Compartilhar"}
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={() => handleDownload(c)}>
                    <Download className="size-3.5" /> Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
