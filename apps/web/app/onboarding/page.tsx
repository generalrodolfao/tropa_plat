"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { useAuthStore } from "@/store/authStore"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isHydrated, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!isHydrated) return
    const hasToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (!user && !hasToken) router.replace("/login")
    else if (user?.careerGoal) router.replace("/app")
  }, [isHydrated, user, router])

  return <OnboardingWizard onComplete={() => router.push("/app")} />
}
