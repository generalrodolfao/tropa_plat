import { API_BASE, getAuthHeaders } from "./client"
import type {
  Course,
  Trail,
  Ebook,
  EbookDetail,
  LibraryStats,
  ReadingCertificate,
  PdiJourney,
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

  myTeams: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/hackathons/me/teams`, { headers: getAuthHeaders() })
    return handle(res)
  },

  createTeam: async (hackathonId: string, name: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/hackathons/teams`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ hackathonId, name }),
    })
    return handle(res)
  },

  joinTeam: async (teamId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/hackathons/join`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ teamId }),
    })
    return handle(res)
  },

  submit: async (data: {
    hackathonId: string
    title: string
    repoUrl?: string
    demoUrl?: string
    description?: string
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/hackathons/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  submissions: async (hackathonId: string): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/hackathons/${hackathonId}/submissions`, { headers: getAuthHeaders() })
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

  apply: async (jobId: string, coverLetter?: string): Promise<{ ok: boolean }> => {
    const res = await fetch(`${API_BASE}/jobs/apply`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ jobId, coverLetter }),
    })
    return handle(res)
  },

  myApplications: async (): Promise<Array<{ id: string; jobId: string; status: string }>> => {
    const res = await fetch(`${API_BASE}/jobs/my-applications`, { headers: getAuthHeaders() })
    return handle(res)
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
  list: async (): Promise<{ total: number; reading: number; done: number; ebooks: Ebook[] }> => {
    const res = await fetch(`${API_BASE}/library`, { headers: getAuthHeaders() })
    return handle(res)
  },

  getStats: async (): Promise<LibraryStats> => {
    const { ebooks } = await bibliotecaApi.list()
    return {
      total: ebooks.length,
      reading: ebooks.filter((b) => b.status === "lendo").length,
      done: ebooks.filter((b) => b.status === "concluido").length,
      hours: ebooks.reduce((acc, b) => acc + Math.round(b.readPages / 15), 0),
    }
  },

  getEbook: async (slug: string): Promise<EbookDetail> => {
    const res = await fetch(`${API_BASE}/library/ebooks/${slug}`, { headers: getAuthHeaders() })
    return handle(res)
  },

  updateProgress: async (ebookId: string, readPages: number): Promise<{ status: string; progress: { readPages: number; status: string } }> => {
    const res = await fetch(`${API_BASE}/library/progress`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ ebookId, readPages }),
    })
    return handle(res)
  },

  getCertificates: async (): Promise<ReadingCertificate[]> => {
    const res = await fetch(`${API_BASE}/library/certificates`, { headers: getAuthHeaders() })
    return handle(res)
  },
}

// PDI — GET /v1/pdi/journey
export const pdiApi = {
  getJourney: async (): Promise<PdiJourney> => {
    const res = await fetch(`${API_BASE}/pdi/journey`, { headers: getAuthHeaders() })
    return handle(res)
  },
  getPlan: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/pdi/plan`, { headers: getAuthHeaders() })
    return handle(res)
  },
  savePlan: async (data: {
    objective?: string
    totalWeeks?: number
    weeklyHours?: number
    milestones: Array<{
      title: string
      description?: string
      skills?: string[]
      estimatedWeeks?: number
      courses?: Array<{ title: string; reason?: string }>
      projects?: Array<{ title: string; description?: string }>
    }>
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/pdi/plan`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },
}

// Projetos — GET/POST /v1/projects
export const projectsApi = {
  list: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/projects`, { headers: getAuthHeaders() })
    return handle(res)
  },

  mySubmissions: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/projects/my-submissions`, { headers: getAuthHeaders() })
    return handle(res)
  },

  submit: async (data: {
    projectId: string
    submissionUrl: string
    description?: string
    attachments?: string[]
  }): Promise<{ ok: boolean; submissionId: string }> => {
    const res = await fetch(`${API_BASE}/projects/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  pending: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/projects/submissions/pending`, { headers: getAuthHeaders() })
    return handle(res)
  },

  grade: async (data: {
    submissionId: string
    score: number
    feedback: string
    criteriaScores?: Record<string, number>
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/projects/grade`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
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
  getBadges: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/gamification/badges`, { headers: getAuthHeaders() })
    return handle(res)
  },
  getRanks: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/gamification/ranks`, { headers: getAuthHeaders() })
    return handle(res)
  },
}

// Notificações — /v1/notifications
export const notificationsApi = {
  list: async (limit = 20): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/notifications?limit=${limit}`, { headers: getAuthHeaders() })
    return handle(res)
  },
  unreadCount: async (): Promise<{ count: number }> => {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, { headers: getAuthHeaders() })
    return handle(res)
  },
  markRead: async (id: string) => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    })
    return handle(res)
  },
  markAllRead: async () => {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    })
    return handle(res)
  },
}

// Certificados — /v1/certificates
export const certificatesApi = {
  my: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/certificates/my`, { headers: getAuthHeaders() })
    return handle(res)
  },
  verify: async (serial: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/certificates/verify/${encodeURIComponent(serial)}`)
    return handle(res)
  },
}

// CV persistido — /v1/cv
export const cvApi = {
  get: async (): Promise<{ cv: any; review: any; text: string | null }> => {
    const res = await fetch(`${API_BASE}/cv`, { headers: getAuthHeaders() })
    return handle(res)
  },
  save: async (data: { text: string; parsed?: unknown; review?: unknown }) => {
    const res = await fetch(`${API_BASE}/cv`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },
}

// CV — POST /v1/ai/cv/review
export const aiApi = {
  reviewCv: async (cvText: string, targetRole?: string): Promise<CvReview> => {
    const res = await fetch(`${API_BASE}/ai/cv/review`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ cvText, targetRole }),
    })
    return handle(res)
  },

  parseCv: async (text: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/ai/cv/parse`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ text }),
    })
    return handle(res)
  },

  generateDiagnostic: async (skills?: string[], questionsPerSkill = 3): Promise<any> => {
    const res = await fetch(`${API_BASE}/ai/onboarding/diagnostic`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ skills, questionsPerSkill }),
    })
    return handle(res)
  },

  generatePdi: async (data: {
    objective: string
    currentSkills: string
    learningStyle?: string
    hoursPerWeek?: number
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/ai/pdi/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
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

// Quizzes — GET /v1/quizzes/lesson/:id e POST /v1/quizzes/:id/attempt
export const quizzesApi = {
  getByLesson: async (lessonId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/quizzes/lesson/${lessonId}`, { headers: getAuthHeaders() })
    return handle(res)
  },

  submitAttempt: async (
    quizId: string,
    answers: Array<{ questionId: string; chosenIndex: number; timeMs: number }>,
  ): Promise<any> => {
    const res = await fetch(`${API_BASE}/quizzes/${quizId}/attempt`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers }),
    })
    return handle(res)
  },

  adminList: async (): Promise<{ items: any[]; total: number }> => {
    const res = await fetch(`${API_BASE}/quizzes/admin/all`, { headers: getAuthHeaders() })
    return handle(res)
  },

  createQuiz: async (data: {
    lessonId: string
    passingScore?: number
    xpAward?: number
    maxAttempts?: number
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/quizzes/admin`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  addQuestion: async (
    quizId: string,
    data: {
      prompt: string
      options: string[]
      correctIndex: number
      difficulty?: number
      explanation?: string
    },
  ): Promise<any> => {
    const res = await fetch(`${API_BASE}/quizzes/admin/${quizId}/questions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  deleteQuestion: async (questionId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/quizzes/admin/questions/${questionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
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

  // Hackathons (admin)
  listHackathons: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/hackathons/admin/all`, { headers: getAuthHeaders() })
    return handle(res)
  },

  createHackathon: async (data: {
    title: string
    theme?: string
    prizePoolCents?: number
    maxTeamSize?: number
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/hackathons/admin`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  updateHackathonStatus: async (id: string, status: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/hackathons/admin/${id}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    })
    return handle(res)
  },
}
