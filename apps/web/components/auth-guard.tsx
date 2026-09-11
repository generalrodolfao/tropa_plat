"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, tokens, isHydrated, hydrate } = useAuthStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    hydrate().finally(() => setChecking(false))
  }, [hydrate])

  useEffect(() => {
    if (!checking && isHydrated) {
      const hasToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
      if (!user && !tokens && !hasToken) {
        router.replace("/login")
        return
      }
      // usuário autenticado sem onboarding concluído vai para o wizard
      if (user && !user.careerGoal && !user.roles?.includes("admin")) {
        router.replace("/onboarding")
      }
    }
  }, [checking, isHydrated, user, tokens, router])

  if (checking || !isHydrated) {
    return <div className="grid min-h-screen place-items-center bg-background p-8 text-sm text-muted-foreground">Carregando sala de operações...</div>
  }

  const hasToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  if (!user && !tokens && !hasToken) return null

  return <>{children}</>
}
