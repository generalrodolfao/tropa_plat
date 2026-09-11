"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Shield, FileText, Calendar, Clock, ChevronRight } from "lucide-react"
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
}

export default function CertificadosPage() {
  const [items, setItems] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    certificatesApi
      .my()
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) setItems([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const totalHours = items.reduce((acc, c) => acc + (c.hours ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Comprovantes</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Meus certificados</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Emitidos ao concluir cursos, leituras e hackathons · validação por código único
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
                <Badge className="gap-1 px-2.5 py-1 font-mono text-[11px]">
                  <Shield className="size-3" /> {c.status === "issued" ? "válido" : c.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
