"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle, XCircle, Clock, Video } from "lucide-react"
import { API_BASE, getAuthHeaders } from "@/lib/api/client"

interface VideoAsset {
  id: string
  lessonId: string
  lesson: { id: string; title: string }
  status: string
  providerUid: string | null
  hlsUrl: string | null
  mp4Url: string | null
  duration: number | null
  createdAt: string
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/video/admin/all`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setVideos(data.items || [])
      }
    } catch (error) {
      console.error("Failed to load videos:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(lessonId: string) {
    setUploading(true)
    try {
      const res = await fetch(`${API_BASE}/video/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ lessonId }),
      })

      if (res.ok) {
        const data = await res.json()
        // Open upload URL in new tab
        window.open(data.uploadUrl, "_blank")
        // Reload after delay
        setTimeout(loadVideos, 2000)
      }
    } catch (error) {
      console.error("Failed to request upload:", error)
    } finally {
      setUploading(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="mr-1 size-3" /> Pronto</Badge>
      case "processing":
        return <Badge className="bg-yellow-500/20 text-yellow-400"><Clock className="mr-1 size-3" /> Processando</Badge>
      case "error":
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="mr-1 size-3" /> Erro</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Vídeos</h1>
          <p className="text-sm text-muted-foreground">Upload e gerenciamento de vídeos via Cloudflare Stream</p>
        </div>
        <Button onClick={loadVideos} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum vídeo encontrado</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Faça upload de vídeos para as aulas para habilitar o player
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {videos.map((video) => (
            <Card key={video.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-muted p-2">
                      <Video className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{video.lesson?.title ?? "Aula desconhecida"}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {video.providerUid ?? "N/A"} · {formatDuration(video.duration)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(video.status)}
                    {video.status === "ready" && video.hlsUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(video.hlsUrl!, "_blank")}
                      >
                        Abrir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
