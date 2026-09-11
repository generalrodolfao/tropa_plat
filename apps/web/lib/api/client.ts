export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "") + "/v1"

export function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token = localStorage.getItem("accessToken")
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  headline?: string | null
  timezone?: string
  status?: string
  roles?: string[]
  careerGoal?: string | null
  learningStyle?: string | null
  createdAt?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  timezone?: string
  learningStyle?: string
  careerGoal?: string
}

/** Hackathons */
export interface Hackathon {
  id: string
  title: string
  theme: string
  sponsor: string
  sponsorLogo: string
  prize: number
  phase: string
  phaseLabel: string
  daysLeft: number
  teamSize: number
  yourTeam: string
  skills: string[]
  description: string
  status?: "ativo" | "proximo" | "encerrado"
}

export interface HackathonFormData {
  title: string
  theme: string
  sponsor: string
  prize: number
  phase: string
  phaseLabel: string
  daysLeft: number
  teamSize: number
  yourTeam: string
  skills: string[]
  description: string
}

/** Vagas (backend = jobs) */
export interface Vaga {
  id: string
  title: string
  company: string
  level: string
  description: string
  skills: string[]
  fitScore: number
  companyLogo: string
  tags: string[]
  seniority: string
  location: string
  mode: string
  salary: string
}

/** PDI */
export interface PdiSkill {
  id: string
  name: string
  category: string
  gap: string
  level: number
  target: number
}

export interface PdiNode {
  id: string
  title: string
  description: string
  order: number
  type: "milestone" | "skill" | "course" | "project" | "hackathon"
  children?: PdiNode[]
  status: "done" | "in_progress" | "pending"
  eta: string
  detail: string
  xp: number
}

/** Trails/Courses — backend usa Course + Trail */
export interface Lesson {
  id: string
  title: string
  type: "video" | "desafio" | "sandbox" | "quiz" | "project" | "challenge"
  position?: number
  estimatedMinutes: number
  xpAward: number
  progressPct: number
  completed?: boolean
  locked?: boolean
}

export interface Course {
  id: string
  title: string
  slug: string
  level: string
  xpTotal: number
  xpEarned?: number
  lessons: Lesson[]
  modules?: any[]
  description?: string
}

export interface Trail {
  id: string
  name: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  status: "active" | "paused" | "completed"
  progressPct: number
  progress?: number
  course: Course
  lessons: Lesson[]
  createdAt?: string
}

/** Biblioteca */
export type EbookStatus = "novo" | "lendo" | "concluido"

export interface Ebook {
  id: string
  slug: string
  title: string
  author: string | null
  category: string
  pages: number
  readPages: number
  status: EbookStatus
  completedAt?: string | null
}

export interface EbookDetail extends Ebook {
  description?: string | null
  progress?: { readPages: number; status: EbookStatus } | null
}

export interface LibraryStats {
  total: number
  reading: number
  done: number
  hours: number
}

export interface ReadingCertificate {
  id: string
  type: string
  referenceId: string | null
  title: string
  hours: number
  serial: string
  issuedAt: string
  verifyUrl?: string | null
  status: string
}

/** PDI */
export interface PdiJourneySkill {
  skillId: string
  name: string
  level: number
  confidence: number
  targetLevel: number
}

export interface PdiJourney {
  skills: PdiJourneySkill[]
  overall: {
    totalSkills: number
    averageLevel: number
  }
}

/** Ligas */
export interface LeagueMember {
  id: string
  name: string
  avatar?: string
  rank: number
  xp: number
  position: number
}

export interface League {
  id: string
  name: string
  title: string
  description: string
  status: "ativo" | "encerrado"
  members: LeagueMember[]
  ranking: LeagueMember[]
}

/** CV */
export interface CvReviewSection {
  title: string
  score: number
  feedback: string
}

export interface CvReview {
  overallScore: number
  summary: string
  sections: CvReviewSection[]
  atsScore: number
  strengths: string[]
  improvements: string[]
}
