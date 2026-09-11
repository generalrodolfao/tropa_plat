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

export default function CadastroPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    try {
      await register({ step: "step1", name, email, password })
      router.push("/onboarding")
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
            <CardTitle className="font-display text-2xl">Alistar-se</CardTitle>
            <CardDescription>Crie sua conta em 30 segundos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@tropa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha (mín. 8)</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>

              {error && <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Criar conta
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Entrar
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
