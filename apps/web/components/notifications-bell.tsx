"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notificationsApi } from "@/lib/api/service"

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  readAt: string | null
  sentAt: string
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, unread] = await Promise.allSettled([
        notificationsApi.list(15),
        notificationsApi.unreadCount(),
      ])
      if (list.status === "fulfilled") setItems(Array.isArray(list.value) ? list.value : [])
      if (unread.status === "fulfilled") setCount(unread.value.count ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(async () => {
      try {
        const unread = await notificationsApi.unreadCount()
        setCount(unread.count ?? 0)
      } catch {
        // ignore
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [load])

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)))
    setCount((c) => Math.max(0, c - 1))
    try {
      await notificationsApi.markRead(id)
    } catch {
      // ignore
    }
  }

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setCount(0)
    try {
      await notificationsApi.markAllRead()
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notificações"
        className="relative"
        onClick={() => {
          setOpen((o) => !o)
          if (!open) load()
        }}
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary font-mono text-[9px] font-bold text-background">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-2 shadow-xl">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Notificações</span>
              {count > 0 && (
                <button onClick={markAll} className="flex items-center gap-1 font-mono text-[10px] text-primary hover:underline">
                  <CheckCheck className="size-3" /> marcar todas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> carregando
                </div>
              ) : items.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">Nenhuma notificação.</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/60 ${n.readAt ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {!n.readAt && <span className="size-1.5 rounded-full bg-primary" />}
                      <span className="text-sm font-medium text-foreground">{n.title}</span>
                    </div>
                    {n.body && <p className="mt-0.5 line-clamp-2 pl-3.5 text-xs text-muted-foreground">{n.body}</p>}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
