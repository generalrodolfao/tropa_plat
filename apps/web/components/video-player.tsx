"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Hls from "hls.js"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  hlsUrl: string
  mp4Url?: string
  poster?: string
  title?: string
  onProgress?: (seconds: number) => void
  onEnded?: () => void
  startTime?: number
}

export function VideoPlayer({ hlsUrl, mp4Url, poster, title, onProgress, onEnded, startTime = 0 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    destroyHls()
    setError(null)

    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      })
      hlsRef.current = hls

      hls.loadSource(hlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setDuration(video.duration)
        if (startTime > 0) {
          video.currentTime = startTime
        }
        video.play().catch(() => {})
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad()
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError()
          } else {
            setError("Erro ao carregar vídeo")
          }
        }
      })
    } else if (hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = hlsUrl
    } else if (mp4Url) {
      video.src = mp4Url
    } else if (hlsUrl) {
      // Last resort: try direct HLS URL
      video.src = hlsUrl
    } else {
      setError("Nenhuma URL de vídeo disponível")
    }

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onProgress?.(video.currentTime)
    }

    const onLoadedMetadata = () => {
      if (!hlsRef.current) {
        setDuration(video.duration)
      }
    }

    const onVideoEnded = () => {
      setPlaying(false)
      onEnded?.()
    }

    video.addEventListener("timeupdate", onTimeUpdate)
    video.addEventListener("loadedmetadata", onLoadedMetadata)
    video.addEventListener("ended", onVideoEnded)

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("loadedmetadata", onLoadedMetadata)
      video.removeEventListener("ended", onVideoEnded)
      destroyHls()
    }
  }, [hlsUrl, mp4Url, startTime, onProgress, onEnded, destroyHls])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current
    if (!video) return
    const vol = parseFloat(e.target.value)
    video.volume = vol
    setVolume(vol)
  }

  function seek(seconds: number) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current
    if (!video) return
    const time = parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
  }

  function toggleFullscreen() {
    const video = videoRef.current
    if (!video) return
    if (video.requestFullscreen) {
      video.requestFullscreen()
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  function handleMouseMove() {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000) as unknown as NodeJS.Timeout
  }

  if (error) {
    return (
      <div className="aspect-video flex items-center justify-center rounded-xl border border-border/70 bg-black/50">
        <div className="text-center">
          <Play className="mx-auto mb-2 size-10 text-white/30" />
          <p className="text-sm text-white/50">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border/70 bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="aspect-video w-full cursor-pointer"
        poster={poster}
        onClick={togglePlay}
        playsInline
      />

      {/* Play overlay when paused */}
      {!playing && !error && (
        <div className="absolute inset-0 grid place-items-center bg-black/30" onClick={togglePlay}>
          <div className="grid size-16 place-items-center rounded-full border border-primary/50 bg-primary/20 backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="size-7 fill-primary text-primary" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress bar */}
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-xs text-white/70">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <span className="font-mono text-xs text-white/70">{formatTime(duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8 text-white hover:text-primary" onClick={() => seek(-10)}>
              <SkipBack className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-white hover:text-primary" onClick={togglePlay}>
              {playing ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-white hover:text-primary" onClick={() => seek(10)}>
              <SkipForward className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-white hover:text-primary" onClick={toggleMute}>
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/20 [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            {title && <span className="text-xs text-white/70">{title}</span>}
            <Button variant="ghost" size="icon" className="size-8 text-white hover:text-primary" onClick={toggleFullscreen}>
              <Maximize className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
