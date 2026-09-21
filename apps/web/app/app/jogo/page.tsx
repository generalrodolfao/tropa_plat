"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ExternalLink, Gamepad2, Loader2, Maximize2, RefreshCw } from "lucide-react"
import { gameApi } from "@/lib/api/service"

export default function JogoPage() {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { url } = await gameApi.sso()
      setUrl(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível abrir o jogo.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openNewTab = async () => {
    if (opening) return
    setOpening(true)
    try {
      const { url } = await gameApi.sso()
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível abrir o jogo.")
    } finally {
      setOpening(false)
    }
  }

  const goFullscreen = () => frameRef.current?.requestFullscreen?.()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary">
            <Gamepad2 className="size-3.5" /> Vale dos Dados
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Jogo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aprenda engenharia de dados jogando. Sua conta da plataforma entra conectada automaticamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goFullscreen} disabled={!url} className="gap-2">
            <Maximize2 className="size-4" /> Tela cheia
          </Button>
          <Button variant="outline" size="sm" onClick={openNewTab} disabled={opening} className="gap-2">
            {opening ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />} Nova aba
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {loading && (
          <div className="grid h-[calc(100vh-13rem)] min-h-[420px] place-items-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="font-mono text-xs uppercase tracking-widest">Conectando ao jogo...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="grid h-[calc(100vh-13rem)] min-h-[420px] place-items-center px-6 text-center">
            <div className="space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" onClick={load} className="gap-2">
                <RefreshCw className="size-4" /> Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {url && !loading && !error && (
          <iframe
            ref={frameRef}
            src={url}
            title="Vale dos Dados"
            className="h-[calc(100vh-13rem)] min-h-[420px] w-full border-0 bg-[#0d0b09]"
            allow="fullscreen; autoplay"
          />
        )}
      </Card>
    </div>
  )
}