import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { type User, type AuthTokens } from "../lib/api/client"
import { authApi } from "../lib/api/service"

type RegisterStep = "step1" | "step2" | "complete"

type AdditionalInfo = {
  curriculo?: string
  linkedin?: string
  github?: string
  bio?: string
  experiencia?: string
  educacao?: string
  habilidades?: string[]
  interesses?: string[]
}

type RegisterState = {
  step: RegisterStep
  name: string
  email: string
  password: string
  additionalInfo: AdditionalInfo
  errors: {
    step1: { name?: string; email?: string; password?: string }
    step2: { curriculo?: string }
  }
  isRegistered: boolean
}

type AuthState = RegisterState & {
  user: User | null
  tokens: AuthTokens | null
  isLoading: boolean
  isHydrated: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    step: RegisterStep
    name: string
    email: string
    password: string
    additionalInfo?: AdditionalInfo
  }) => Promise<void>
  setRegisterStep: (step: RegisterStep) => void
  setRegisterField: (field: keyof AdditionalInfo, value: string) => void
  setRegisterErrors: (errors: RegisterState["errors"]) => void
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  hydrate: () => Promise<void>
  clearError: () => void
}

const initialAdditionalInfo: AdditionalInfo = {
  curriculo: "",
  linkedin: "",
  github: "",
  bio: "",
  experiencia: "",
  educacao: "",
  habilidades: [],
  interesses: [],
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,
      isHydrated: false,
      error: null,
      step: "step1" as RegisterStep,
      name: "",
      email: "",
      password: "",
      additionalInfo: { ...initialAdditionalInfo },
      errors: { step1: {}, step2: {} },
      isRegistered: false,

      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const result = await authApi.login({ email, password })
          const tokens: AuthTokens = { accessToken: result.accessToken, refreshToken: result.refreshToken }
          set({ user: result.user, tokens })
          localStorage.setItem("accessToken", tokens.accessToken)
          localStorage.setItem("refreshToken", tokens.refreshToken)
        } catch (e: any) {
          set({ error: e.message || "Credenciais inválidas" })
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        const { step, name, email, password } = data
        try {
          const result = await authApi.register({ name, email, password })
          const tokens: AuthTokens = { accessToken: result.accessToken, refreshToken: result.refreshToken }
          set({ user: result.user, tokens, step: "complete", isRegistered: true })
          localStorage.setItem("accessToken", tokens.accessToken)
          localStorage.setItem("refreshToken", tokens.refreshToken)
        } catch (e: any) {
          const msg = e.message || "Erro no registro"
          if (step === "step1") set({ errors: { step1: { email: msg }, step2: {} }, error: msg })
          else set({ errors: { step1: {}, step2: { curriculo: msg } }, error: msg })
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      setRegisterStep: (step) => set({ step }),
      setRegisterField: (field, value) =>
        set((state) => ({
          additionalInfo: { ...state.additionalInfo, [field]: value },
        })),
      setRegisterErrors: (errors) => set({ errors }),

      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          set({ user: null, tokens: null })
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
        }
      },

      refreshToken: async () => {
        const refresh = get().tokens?.refreshToken ?? localStorage.getItem("refreshToken")
        if (!refresh) throw new Error("Nenhum refresh token")
        const newTokens = await authApi.refresh(refresh)
        set({ tokens: newTokens })
        localStorage.setItem("accessToken", newTokens.accessToken)
        localStorage.setItem("refreshToken", newTokens.refreshToken)
      },

      hydrate: async () => {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          set({ isHydrated: true })
          return
        }
        try {
          const user = await authApi.getCurrentUser()
          set({ user, isHydrated: true })
        } catch {
          // token inválido — limpa
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          set({ user: null, tokens: null, isHydrated: true })
        }
      },
    }),
    {
      name: "tropa-plat-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true
      },
    }
  )
)
