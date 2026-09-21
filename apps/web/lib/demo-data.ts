// Dados simulados para o modo demonstração (pitch/demostração B2B).
// Substituir pelas respostas reais da API quando as rotas B2B existirem.

export interface EmpresaInfo {
  name: string
  plan: string
  seatsTotal: number
  contractRenewal: string
}

export interface EmpresaKpis {
  mrr: number
  seatsUsed: number
  seatsTotal: number
  avgProgress: number
  avgStreak: number
  certificatesThisMonth: number
  atRisk: number
  readyForNextStep: number
}

export interface Turma {
  id: string
  name: string
  dept: string
  trail: string
  seatsUsed: number
  seatsTotal: number
  avgProgress: number
  avgStreak: number
  nextSession: string
  mentor: string
  status: "ativa" | "a_iniciar" | "concluida"
}

export interface Membro {
  name: string
  role: string
  progress: number
  streak: number
  xp: number
  status: "no_ritmo" | "risco_evasao" | "pronto_promocao"
  diagnostic: number
  certification: number
  skills: Array<{ name: string; level: number /* 0-100 */ }>
}

export interface EngagementWeek {
  week: string
  activeUsers: number
  hours: number
}

export interface ParceiroCurso {
  id: string
  title: string
  partner: string
  partnerTicker: string
  tier: string
  hours: number
  students: number
  rating: number
  price: number
  especialidade: string
}

export interface ServicoParceiro {
  id: string
  title: string
  partner: string
  tier: string
  slots: number
  days: number
  earnings: number
  serviceFeePct: number
  skills: string[]
  deadline: string
}

export const empresaDemo: EmpresaInfo = {
  name: "Toccato Technology",
  plan: "Corporativo Anual",
  seatsTotal: 120,
  contractRenewal: "2027-03-01",
}

export const empresaKpisDemo: EmpresaKpis = {
  mrr: 8624,
  seatsUsed: 104,
  seatsTotal: 120,
  avgProgress: 63,
  avgStreak: 12,
  certificatesThisMonth: 38,
  atRisk: 6,
  readyForNextStep: 9,
}

export const engajamentoSemanal: EngagementWeek[] = [
  { week: "W32", activeUsers: 61, hours: 148 },
  { week: "W33", activeUsers: 68, hours: 171 },
  { week: "W34", activeUsers: 72, hours: 190 },
  { week: "W35", activeUsers: 70, hours: 182 },
  { week: "W36", activeUsers: 79, hours: 214 },
  { week: "W37", activeUsers: 84, hours: 236 },
  { week: "W38", activeUsers: 81, hours: 228 },
  { week: "W39", activeUsers: 90, hours: 261 },
  { week: "W40", activeUsers: 94, hours: 277 },
  { week: "W41", activeUsers: 89, hours: 264 },
  { week: "W42", activeUsers: 97, hours: 291 },
  { week: "W43", activeUsers: 102, hours: 312 },
]

export const consumoMensal = [
  { mes: "Mai", seats: 88, custo: 7304 },
  { mes: "Jun", seats: 91, custo: 7563 },
  { mes: "Jul", seats: 95, custo: 7885 },
  { mes: "Ago", seats: 99, custo: 8217 },
  { mes: "Set", seats: 104, custo: 8624 },
]

export const turmasDemo: Turma[] = [
  {
    id: "t-qlik-analistas",
    name: "Turma Qlik — Analistas",
    dept: "BI & Analytics",
    trail: "Trilha Qlik Sense: do zero ao dashboard",
    seatsUsed: 28,
    seatsTotal: 30,
    avgProgress: 71,
    avgStreak: 16,
    nextSession: "Qui · 19h · mentoria ao vivo",
    mentor: "Cap. Ribeiro",
    status: "ativa",
  },
  {
    id: "t-gcp-cloud",
    name: "Turma GCP — Cloud Engineering",
    dept: "Infra & Dados",
    trail: "Trilha Google Cloud Data Engineer",
    seatsUsed: 18,
    seatsTotal: 20,
    avgProgress: 58,
    avgStreak: 9,
    nextSession: "Ter · 20h · lab de BigQuery",
    mentor: "10. Ferreira",
    status: "ativa",
  },
  {
    id: "t-sql-fundamentos",
    name: "Turma SQL — Fundamentos",
    dept: "Financeiro",
    trail: "SQL do zero ao avançado",
    seatsUsed: 34,
    seatsTotal: 40,
    avgProgress: 42,
    avgStreak: 5,
    nextSession: "Seg · 18h · exercícios guiados",
    mentor: "Sgt. Moreira",
    status: "ativa",
  },
  {
    id: "t-python-ich",
    name: "Turma Python — Operações",
    dept: "Operações",
    trail: "Python para análise de dados",
    seatsUsed: 12,
    seatsTotal: 12,
    avgProgress: 88,
    avgStreak: 21,
    nextSession: "Concluída · certificados emitidos",
    mentor: "Cap. Ribeiro",
    status: "concluida",
  },
  {
    id: "t-dados-lideres",
    name: "Turma Dados — Liderança",
    dept: "Diretoria",
    trail: "Dashboards executivos e data storytelling",
    seatsUsed: 0,
    seatsTotal: 18,
    avgProgress: 0,
    avgStreak: 0,
    nextSession: "Início 01/10 · aviso enviado",
    mentor: "Maj. Farias",
    status: "a_iniciar",
  },
]

export const membrosDemo: Membro[] = [
  {
    name: "Ana Beatriz Coelho",
    role: "Analista de BI",
    progress: 92,
    streak: 24,
    xp: 4820,
    status: "pronto_promocao",
    diagnostic: 41,
    certification: 78,
    skills: [
      { name: "SQL", level: 88 },
      { name: "Qlik", level: 82 },
      { name: "Python", level: 64 },
      { name: "Estatística", level: 61 },
      { name: "Storytelling", level: 74 },
    ],
  },
  {
    name: "Bruno Ferraz",
    role: "Analista de Dados",
    progress: 74,
    streak: 17,
    xp: 3310,
    status: "no_ritmo",
    diagnostic: 38,
    certification: 65,
    skills: [
      { name: "SQL", level: 76 },
      { name: "Qlik", level: 69 },
      { name: "Python", level: 55 },
      { name: "Estatística", level: 52 },
      { name: "Storytelling", level: 60 },
    ],
  },
  {
    name: "Camila Duarte",
    role: "Analista Jr.",
    progress: 31,
    streak: 1,
    xp: 890,
    status: "risco_evasao",
    diagnostic: 27,
    certification: 34,
    skills: [
      { name: "SQL", level: 44 },
      { name: "Qlik", level: 30 },
      { name: "Python", level: 22 },
      { name: "Estatística", level: 25 },
      { name: "Storytelling", level: 35 },
    ],
  },
  {
    name: "Diego Mancini",
    role: "Eng. de Dados",
    progress: 67,
    streak: 11,
    xp: 2954,
    status: "no_ritmo",
    diagnostic: 52,
    certification: 71,
    skills: [
      { name: "SQL", level: 81 },
      { name: "Qlik", level: 47 },
      { name: "Python", level: 83 },
      { name: "Estatística", level: 58 },
      { name: "Storytelling", level: 49 },
    ],
  },
  {
    name: "Érica Nogueira",
    role: "Analista de BI",
    progress: 85,
    streak: 19,
    xp: 4021,
    status: "pronto_promocao",
    diagnostic: 45,
    certification: 82,
    skills: [
      { name: "SQL", level: 79 },
      { name: "Qlik", level: 91 },
      { name: "Python", level: 58 },
      { name: "Estatística", level: 66 },
      { name: "Storytelling", level: 85 },
    ],
  },
  {
    name: "Felipe Aragão",
    role: "Analista Financeiro",
    progress: 18,
    streak: 0,
    xp: 210,
    status: "risco_evasao",
    diagnostic: 22,
    certification: 18,
    skills: [
      { name: "SQL", level: 30 },
      { name: "Qlik", level: 18 },
      { name: "Python", level: 12 },
      { name: "Estatística", level: 21 },
      { name: "Storytelling", level: 26 },
    ],
  },
  {
    name: "Gabriela Sanches",
    role: "Cientista de Dados",
    progress: 78,
    streak: 14,
    xp: 3644,
    status: "no_ritmo",
    diagnostic: 63,
    certification: 88,
    skills: [
      { name: "SQL", level: 84 },
      { name: "Qlik", level: 55 },
      { name: "Python", level: 92 },
      { name: "Estatística", level: 87 },
      { name: "Storytelling", level: 72 },
    ],
  },
  {
    name: "Hugo Bertoldo",
    role: "Analista Sr.",
    progress: 55,
    streak: 8,
    xp: 2511,
    status: "no_ritmo",
    diagnostic: 57,
    certification: 69,
    skills: [
      { name: "SQL", level: 74 },
      { name: "Qlik", level: 71 },
      { name: "Python", level: 66 },
      { name: "Estatística", level: 63 },
      { name: "Storytelling", level: 58 },
    ],
  },
]

export const parceirosCursosDemo: ParceiroCurso[] = [
  {
    id: "pc-qlik-sense",
    title: "Qlik Sense para Analistas de Negócio",
    partner: "Toccato Technology",
    partnerTicker: "QLK",
    tier: "Parceiro oficial",
    hours: 24,
    students: 3841,
    rating: 4.8,
    price: 899,
    especialidade: "BI & Dashboards",
  },
  {
    id: "pc-gcp-de",
    title: "Google Cloud Data Engineer",
    partner: "Toccato Technology",
    partnerTicker: "GCP",
    tier: "Parceiro oficial",
    hours: 40,
    students: 2190,
    rating: 4.9,
    price: 1490,
    especialidade: "Cloud & Eng. de Dados",
  },
  {
    id: "pc-qlik-nprinting",
    title: "Qlik NPrinting — Relatórios em escala",
    partner: "Toccato Technology",
    partnerTicker: "QLK",
    tier: "Parceiro oficial",
    hours: 12,
    students: 1120,
    rating: 4.6,
    price: 490,
    especialidade: "BI & Relatórios",
  },
  {
    id: "pc-looker",
    title: "Looker e LookML na prática",
    partner: "Toccato Technology",
    partnerTicker: "GCP",
    tier: "Parceiro oficial",
    hours: 18,
    students: 968,
    rating: 4.7,
    price: 699,
    especialidade: "BI & Modelagem",
  },
]

export const servicosParceirosDemo: ServicoParceiro[] = [
  {
    id: "sp-qlik-migracao",
    title: "Migração de dashboards Qlik View → Sense",
    partner: "Toccato Technology",
    tier: "Intermediário",
    slots: 3,
    days: 15,
    earnings: 5400,
    serviceFeePct: 12,
    skills: ["Qlik", "SQL"],
    deadline: "5 dias para solicitar",
  },
  {
    id: "sp-dash-vendas",
    title: "Painel executivo de vendas (DataApp + CRM)",
    partner: "Toccato Technology",
    tier: "Pleno",
    slots: 2,
    days: 20,
    earnings: 7800,
    serviceFeePct: 12,
    skills: ["Qlik", "Storytelling"],
    deadline: "2 dias para solicitar",
  },
  {
    id: "sp-pipeline-gcp",
    title: "Pipeline batch no GCP (Dataflow + BigQuery)",
    partner: "Toccato Technology",
    tier: "Pleno",
    slots: 1,
    days: 30,
    earnings: 12000,
    serviceFeePct: 10,
    skills: ["GCP", "Python"],
    deadline: "7 dias para solicitar",
  },
  {
    id: "sp-qa-dados",
    title: "Auditoria de qualidade de dados (contratos de dados)",
    partner: "Toccato Technology",
    tier: "Sênior",
    slots: 2,
    days: 10,
    earnings: 9600,
    serviceFeePct: 10,
    skills: ["SQL", "Estatística"],
    deadline: "4 dias para solicitar",
  },
]

export const takeRateDemo = [
  { label: "Assinatura B2C", pct: 87 },
  { label: "Cursos de parceiros", pct: 25 },
  { label: "Serviços/projetos", pct: 12 },
  { label: "Contrato B2B seats", pct: 75 },
]

export const marketplaceReceitaDemo = {
  gmvMensal: 342500,
  receitaPlataforma: 46800,
  transacoes: 38,
  distribuicao: [
    { label: "Licenças B2B", valor: 24100 },
    { label: "Cursos parceiros", valor: 12420 },
    { label: "Serviços executados", valor: 10280 },
  ],
}

export function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}
