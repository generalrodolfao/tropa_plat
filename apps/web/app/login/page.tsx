"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState("demo@tropadosdados.com")
  const [password, setPassword] = useState("tropa-demo-123")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    try {
      await login(email, password)
      router.push("/app")
    } catch {}
  }

  return (
    <div className="noise-bg grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-md border border-primary/40 bg-primary/10">
            <Shield className="size-5 text-primary" />
          </div>
          <span className="font-display text-lg font-bold tracking-wide">
            TROPA<span className="text-primary">DOS</span>DADOS
          </span>
        </Link>

        <Card className="hud-corners border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Entrar</CardTitle>
            <CardDescription>Acesse sua sala de operações</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@tropa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              {error && <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Entrar
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link href="/cadastro" className="font-medium text-primary hover:underline">
                  Alistar-se
                </Link>
              </p>
              <p className="text-center font-mono text-xs text-muted-foreground">
                Demo: demo@tropadosdados.com / tropa-demo-123 · Admin: admin@tropadosdados.com / admin-tropa-123
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
