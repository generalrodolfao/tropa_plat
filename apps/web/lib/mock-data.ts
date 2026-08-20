export type LessonType = "video" | "sandbox" | "quiz" | "project" | "challenge"

export type Lesson = {
  id: string
  title: string
  type: LessonType
  durationMin: number
  xp: number
  completed: boolean
  locked?: boolean
}

export type Module = {
  id: string
  title: string
  codename: string
  mission: string
  lessons: Lesson[]
  xp: number
}

export type Course = {
  slug: string
  title: string
  codename: string
  level: "Recruta" | "Soldado" | "Sargento"
  xpTotal: number
  xpEarned: number
  modules: Module[]
  meta: {
    students: string
    duration: string
    updated: string
  }
}

export const COURSES: Course[] = [
  {
    slug: "sql-fundamentos",
    title: "SQL — Fundamentos de Operação",
    codename: "OP-SQL-001",
    level: "Recruta",
    xpTotal: 1200,
    xpEarned: 640,
    modules: [
      {
        id: "m1",
        title: "Primeiro Contato com a Base",
        codename: "MISSÃO 01",
        mission:
          "Entender o que é um banco relacional e executar seu primeiro SELECT.",
        xp: 180,
        lessons: [
          { id: "l1", title: "Boas-vindas ao pelotão", type: "video", durationMin: 4, xp: 40, completed: true },
          { id: "l2", title: "Bancos relacionais na prática", type: "video", durationMin: 12, xp: 60, completed: true },
          { id: "l3", title: "SELECT: seu primeiro disparo", type: "sandbox", durationMin: 15, xp: 80, completed: true },
        ],
      },
      {
        id: "m2",
        title: "Filtrando o Campo de Batalha",
        codename: "MISSÃO 02",
        mission: "Dominar WHERE, operadores e a arte de filtrar dados sem pânico.",
        xp: 320,
        lessons: [
          { id: "l4", title: "WHERE: selecionando alvos", type: "video", durationMin: 11, xp: 55, completed: true },
          { id: "l5", title: "Operadores de comparação", type: "quiz", durationMin: 6, xp: 45, completed: true },
          { id: "l6", title: "Limpando o terreno com AND/OR/NOT", type: "sandbox", durationMin: 18, xp: 90, completed: true },
          { id: "l7", title: "Checagem: filtra aí, soldado", type: "quiz", durationMin: 8, xp: 70, completed: false },
        ],
      },
      {
        id: "m3",
        title: "Ordenação e Agrupamento",
        codename: "MISSÃO 03",
        mission: "Organizar o caos com ORDER BY, GROUP BY e funções de agregação.",
        xp: 380,
        lessons: [
          { id: "l8", title: "ORDER BY: colocando a tropa em fila", type: "video", durationMin: 10, xp: 50, completed: false, locked: true },
          { id: "l9", title: "GROUP BY: esquadrões de dados", type: "video", durationMin: 14, xp: 65, completed: false, locked: true },
          { id: "l10", title: "COUNT, SUM, AVG: armamentos de agregação", type: "sandbox", durationMin: 20, xp: 100, completed: false, locked: true },
          { id: "l11", title: "Exercício final da missão", type: "quiz", durationMin: 10, xp: 80, completed: false, locked: true },
        ],
      },
      {
        id: "m4",
        title: "JOIN: Unidos Ficamos Fortes",
        codename: "MISSÃO 04",
        mission: "Cruzar tabelas e transformar dados soltos em inteligência.",
        xp: 320,
        lessons: [
          { id: "l12", title: "INNER JOIN: o encontro das tropas", type: "video", durationMin: 13, xp: 60, completed: false, locked: true },
          { id: "l13", title: "LEFT/RIGHT JOIN e os aliados perdidos", type: "video", durationMin: 12, xp: 60, completed: false, locked: true },
          { id: "l14", title: "Projeto: analisar vendas por região", type: "project", durationMin: 25, xp: 120, completed: false, locked: true },
        ],
      },
    ],
    meta: {
      students: "1.284 soldados em treino",
      duration: "~18h",
      updated: "há 2 semanas",
    },
  },
]

export type TaskType = "assistir" | "praticar" | "revisar" | "hackathon"

export type DailyTask = {
  id: string
  type: TaskType
  title: string
  detail: string
  minutes: number
  xp: number
}

export const OFENSIVA_DO_DIA: DailyTask[] = [
  { id: "t1", type: "assistir", title: "Assistir: Limpando o terreno", detail: "AND/OR/NOT no SQL · Missão 02", minutes: 8, xp: 45 },
  { id: "t2", type: "praticar", title: "Praticar: sandbox de filtros", detail: "15 min no sandbox SQL do browser", minutes: 15, xp: 80 },
  { id: "t3", type: "revisar", title: "Revisar: quiz de WHERE", detail: "Repetição espaçada · 6 perguntas", minutes: 5, xp: 30 },
  { id: "t4", type: "hackathon", title: "Hackathon: apoiar o time", detail: "2ª fase — modelo de churn aberto", minutes: 20, xp: 120 },
]

export type LeagueMember = {
  rank: number
  name: string
  xp: number
  you?: boolean
  movement: "up" | "down" | "same"
}

export const LEAGUE: { name: string; week: string; members: LeagueMember[] } = {
  name: "Batalhão Bravo — Liga Sargento",
  week: "Semana 17 · segunda a domingo",
  members: [
    { rank: 1, name: "Mariana C.", xp: 1240, movement: "up" },
    { rank: 2, name: "Rafael T.", xp: 1150, movement: "same" },
    { rank: 3, name: "Você", xp: 980, movement: "up", you: true },
    { rank: 4, name: "Beatriz L.", xp: 910, movement: "down" },
    { rank: 5, name: "Pedro M.", xp: 875, movement: "same" },
    { rank: 6, name: "Júlia R.", xp: 820, movement: "down" },
    { rank: 7, name: "Igor V.", xp: 760, movement: "up" },
    { rank: 8, name: "Camila S.", xp: 705, movement: "same" },
    { rank: 9, name: "Diego N.", xp: 650, movement: "down" },
  ],
}

export const RANK_LADDER = [
  { title: "Recruta", xp: 0 },
  { title: "Soldado", xp: 800 },
  { title: "Sargento", xp: 2500 },
  { title: "Cabo de Guerra", xp: 5000 },
  { title: "Tenente", xp: 9000 },
  { title: "Comandante", xp: 15000 },
]

export function currentRank(xp: number) {
  let current = RANK_LADDER[0]
  let next = RANK_LADDER[1]
  for (let i = 0; i < RANK_LADDER.length; i++) {
    if (xp >= RANK_LADDER[i].xp) current = RANK_LADDER[i]
    if (xp < RANK_LADDER[i].xp) {
      next = RANK_LADDER[i]
      break
    }
  }
  const progress = Math.min(100, ((xp - current.xp) / (next.xp - current.xp)) * 100)
  return { current, next, progress }
}