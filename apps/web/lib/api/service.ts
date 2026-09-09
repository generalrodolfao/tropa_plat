import { API_BASE, getAuthHeaders } from "./client"
import type {
  Hackathon,
  HackathonFormData,
  Vaga,
  PdiSkill,
  PdiNode,
  Course,
  Trail,
  Ebook,
  LibraryStats,
  ReadingCertificate,
  League,
  CvReview,
  LoginCredentials,
  RegisterCredentials,
  User,
  AuthTokens,
} from "./client"

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || body.error || `Erro ${res.status}`)
  }
  return res.json()
}

// Auth — backend retorna {accessToken, refreshToken, user}
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
    return handle(res)
  },

  register: async (data: RegisterCredentials): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    return handle(res)
  },

  logout: async (refreshToken?: string) => {
    const token = refreshToken ?? (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null)
    if (!token) return
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
    })
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() })
    return handle(res)
  },

  updateMe: async (data: Partial<User> & { headline?: string; bio?: string; linkedinUrl?: string; githubUrl?: string; timezone?: string }): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    return handle(res)
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    return handle<{ ok: boolean; resetToken?: string }>(res)
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    })
    return handle(res)
  },
}

// Hackathons — GET /v1/hackathons
export const hackathonsApi = {
  list: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/hackathons`, { headers: getAuthHeaders() })
    return handle(res)
  },
}

// Jobs = vagas — GET /v1/jobs
export const vagasApi = {
  list: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/jobs`, { headers: getAuthHeaders() })
    const data = await handle<any[]>(res)
    return data
  },
}

// Trails — GET /v1/trilhas  e  GET /v1/content/courses
export const trailsApi = {
  list: async (): Promise<Trail[]> => {
    // tenta trilhas do usuário, fallback para cursos publicados
    const [trilhas, courses] = await Promise.allSettled([
      fetch(`${API_BASE}/trilhas`, { headers: getAuthHeaders() }).then(handle<Trail[]>),
      fetch(`${API_BASE}/content/courses`, { headers: getAuthHeaders() }).then(handle<any[]>),
    ])
    if (trilhas.status === "fulfilled" && trilhas.value.length > 0) return trilhas.value as Trail[]
    if (courses.status === "fulfilled") {
      // adapta Course -> Trail fake para UI
      return (courses.value as any[]).map((c) => ({
        id: c.id,
        name: c.title,
        description: c.description ?? "",
        difficulty: "beginner" as const,
        status: "active" as const,
        progressPct: 0,
        progress: 0,
        course: { id: c.id, title: c.title, slug: c.slug, level: c.level ?? "Iniciante", lessons: [], xpTotal: c.xpTotal },
        lessons: [],
      }))
    }
    return []
  },

  listCourses: async (): Promise<Course[]> => {
    const res = await fetch(`${API_BASE}/content/courses`, { headers: getAuthHeaders() })
    const data = await handle<any[]>(res)
    return data.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      level: c.level ?? "Iniciante",
      xpTotal: c.xpTotal,
      xpEarned: 0,
      lessons: (c.modules ?? []).flatMap((m: any) => m.lessons ?? []),
      modules: c.modules,
      description: c.description,
    }))
  },

  getCourse: async (slug: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/content/courses/${slug}`, { headers: getAuthHeaders() })
    return handle(res)
  },

  create: async (data: { name: string; description: string; courseId: string; difficulty?: string }) => {
    const res = await fetch(`${API_BASE}/trilhas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },
}

// Biblioteca — GET /v1/library
export const bibliotecaApi = {
  listEbooks: async (): Promise<Ebook[]> => {
    const res = await fetch(`${API_BASE}/library`, { headers: getAuthHeaders() })
    const data = await handle<any>(res)
    // backend pode retornar {ebooks} ou array
    if (Array.isArray(data)) return data
    if (data.ebooks) return data.ebooks
    return []
  },
  getStats: async (): Promise<LibraryStats> => {
    const res = await fetch(`${API_BASE}/library`, { headers: getAuthHeaders() })
    const data = await handle<any>(res)
    return data.stats ?? data
  },
  getCertificates: async (): Promise<ReadingCertificate[]> => {
    const res = await fetch(`${API_BASE}/library/certificates`, { headers: getAuthHeaders() })
    return handle(res)
  },
}

// Ligas — GET /v1/leagues/current
export const ligasApi = {
  getLeague: async (): Promise<League> => {
    const res = await fetch(`${API_BASE}/leagues/current`, { headers: getAuthHeaders() })
    return handle(res)
  },
}

// Gamificação — GET /v1/gamification/summary
export const gamificationApi = {
  getSummary: async () => {
    const res = await fetch(`${API_BASE}/gamification/summary`, { headers: getAuthHeaders() })
    return handle(res)
  },
}

// CV
export const cvApi = {
  getReview: async (): Promise<CvReview> => {
    const res = await fetch(`${API_BASE}/library`, { headers: getAuthHeaders() })
    return handle(res)
  },
}

// Progress — POST /v1/progress/start|complete e GET /v1/progress/course/:id
export const progressApi = {
  start: async (lessonId: string) => {
    const res = await fetch(`${API_BASE}/progress/start`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ lessonId }),
    })
    return handle(res)
  },
  complete: async (lessonId: string) => {
    const res = await fetch(`${API_BASE}/progress/complete`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ lessonId }),
    })
    return handle<{ ok: boolean; xpAwarded: number }>(res)
  },
  getCourseProgress: async (courseId: string) => {
    const res = await fetch(`${API_BASE}/progress/course/${courseId}`, { headers: getAuthHeaders() })
    return handle<{ totalLessons: number; completedLessons: number; progressPct: number; earnedXp: number; totalXp: number; completedIds: string[] }>(res)
  },
  getLesson: async (lessonId: string) => {
    const res = await fetch(`${API_BASE}/content/lessons/${lessonId}`, { headers: getAuthHeaders() })
    return handle(res)
  },
}

// Admin — gestão de conteúdo, usuários e pagamentos
export const adminApi = {
  // Cursos
  listCourses: async (params?: { page?: number; limit?: number }) => {
    const p = new URLSearchParams()
    if (params?.page) p.set("page", String(params.page))
    if (params?.limit) p.set("limit", String(params.limit))
    const res = await fetch(`${API_BASE}/admin/content/courses?${p}`, { headers: getAuthHeaders() })
    return handle(res)
  },

  createCourse: async (data: { title: string; slug: string; description?: string; level?: string }) => {
    const res = await fetch(`${API_BASE}/admin/content/courses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  publishCourse: async (courseId: string) => {
    const res = await fetch(`${API_BASE}/admin/content/courses/${courseId}/publish`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
    return handle(res)
  },

  createModule: async (courseId: string, data: { title: string; position: number; type?: string }) => {
    const res = await fetch(`${API_BASE}/admin/content/courses/${courseId}/modules`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  createLesson: async (moduleId: string, data: { title: string; position: number; type: string; xpAward?: number }) => {
    const res = await fetch(`${API_BASE}/admin/content/modules/${moduleId}/lessons`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  // Usuários
  listUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const p = new URLSearchParams()
    if (params?.page) p.set("page", String(params.page))
    if (params?.limit) p.set("limit", String(params.limit))
    if (params?.search) p.set("search", params.search)
    const res = await fetch(`${API_BASE}/admin/users?${p}`, { headers: getAuthHeaders() })
    return handle(res)
  },

  updateUser: async (userId: string, data: { status?: string; roles?: string[] }) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  // Pagamentos
  listSubscriptions: async (params?: { page?: number; limit?: number; status?: string }) => {
    const p = new URLSearchParams()
    if (params?.page) p.set("page", String(params.page))
    if (params?.limit) p.set("limit", String(params.limit))
    if (params?.status) p.set("status", params.status)
    const res = await fetch(`${API_BASE}/payments/admin/subscriptions?${p}`, { headers: getAuthHeaders() })
    return handle(res)
  },

  listPlans: async () => {
    const res = await fetch(`${API_BASE}/payments/admin/plans`, { headers: getAuthHeaders() })
    return handle(res)
  },

  createPlan: async (data: { code: string; name: string; type: string; priceCents: number; billingCycle: string }) => {
    const res = await fetch(`${API_BASE}/payments/admin/plans`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  createCoupon: async (data: { code: string; type: string; value: number; maxUses?: number; expiresAt?: string }) => {
    const res = await fetch(`${API_BASE}/payments/admin/coupons`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },
}
