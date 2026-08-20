export type Hackathon = {
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
  status: "ativo" | "proximo" | "encerrado"
  skills: string[]
  description: string
}

export const HACKATHONS: Hackathon[] = [
  {
    id: "h1",
    title: "Previsão de churn",
    theme: "Telecom · dataset de 50 mil linhas",
    sponsor: "Nubank Labs",
    sponsorLogo: "NL",
    prize: 5000,
    phase: "2",
    phaseLabel: "Modelagem em andamento",
    daysLeft: 12,
    teamSize: 4,
    yourTeam: "Esquadrão SQL",
    status: "ativo",
    skills: ["Python", "SQL", "ML básico"],
    description:
      "Monte um modelo que preveja quais clientes vão cancelar o plano no próximo trimestre. Os 3 melhores times apresentam para o júri da Nubank.",
  },
  {
    id: "h2",
    title: "Análise de vendas por região",
    theme: "Varejo · 120 mil linhas de vendas",
    sponsor: "Magalu",
    sponsorLogo: "ML",
    prize: 3000,
    phase: "1",
    phaseLabel: "Inscrições abertas",
    daysLeft: 26,
    teamSize: 3,
    yourTeam: "",
    status: "proximo",
    skills: ["SQL", "Excel", "Visualização"],
    description:
      "Descubra por que algumas regiões crescem mais rápido e entregue um relatório acionável para o time de operações.",
  },
  {
    id: "h3",
    title: "Churn — Edição Inverno",
    theme: "SaaS · desafio trimestral",
    sponsor: "Tropa dos Dados",
    sponsorLogo: "TD",
    prize: 1000,
    phase: "finalizada",
    phaseLabel: "Encerrado",
    daysLeft: 0,
    teamSize: 4,
    yourTeam: "Esquadrão SQL",
    status: "encerrado",
    skills: ["Python", "SQL"],
    description: "Hackathon de lançamento da plataforma. 47 times participaram.",
  },
]

export type Vaga = {
  id: string
  title: string
  company: string
  companyLogo: string
  location: string
  mode: "Remoto" | "Híbrido" | "Presencial"
  salary: string
  seniority: string
  fitScore: number
  skills: string[]
  tags: string[]
}

export const VAGAS: Vaga[] = [
  {
    id: "v1",
    title: "Analista de Dados Pleno",
    company: "Nubank",
    companyLogo: "N",
    location: "São Paulo, SP",
    mode: "Híbrido",
    salary: "R$ 9.500",
    seniority: "Pleno",
    fitScore: 82,
    skills: ["SQL", "Python", "Metabase"],
    tags: ["fit alto", "responde rápido"],
  },
  {
    id: "v2",
    title: "Analista de BI",
    company: "Magalu",
    companyLogo: "M",
    location: "Remoto",
    mode: "Remoto",
    salary: "R$ 7.200",
    seniority: "Júnior",
    fitScore: 74,
    skills: ["SQL", "Excel", "Power BI"],
    tags: ["fit médio"],
  },
  {
    id: "v3",
    title: "Engenheiro de Dados Jr.",
    company: "iFood",
    companyLogo: "IF",
    location: "Osasco, SP",
    mode: "Híbrido",
    salary: "R$ 8.000",
    seniority: "Júnior",
    fitScore: 61,
    skills: ["Python", "SQL", "Airflow"],
    tags: ["fit médio"],
  },
  {
    id: "v4",
    title: "Cientista de Dados",
    company: "Banco Inter",
    companyLogo: "BI",
    location: "Remoto",
    mode: "Remoto",
    salary: "R$ 12.000",
    seniority: "Sênior",
    fitScore: 38,
    skills: ["ML", "Python", "Estatística"],
    tags: ["exige sênior"],
  },
]

export type PdiSkill = {
  name: string
  level: number
  target: number
  gap: number
}

export const PDI_SKILLS: PdiSkill[] = [
  { name: "SQL", level: 3, target: 4, gap: 1 },
  { name: "Python", level: 2, target: 4, gap: 2 },
  { name: "Estatística", level: 1, target: 3, gap: 2 },
  { name: "Visualização", level: 3, target: 4, gap: 1 },
  { name: "Excel", level: 4, target: 4, gap: 0 },
  { name: "ML Básico", level: 1, target: 3, gap: 2 },
]

export type PdiNode = {
  id: string
  type: "milestone" | "skill" | "course" | "project" | "hackathon"
  title: string
  detail: string
  status: "done" | "in_progress" | "todo"
  eta: string
  xp: number
}

export const PDI_PLAN: PdiNode[] = [
  { id: "n1", type: "milestone", title: "Analista de Dados", detail: "Meta de carreira · nível Pleno", status: "done", eta: "Concluído", xp: 0 },
  { id: "n2", type: "skill", title: "SQL avançado", detail: "JOIN, window functions, otimização", status: "in_progress", eta: "~2 semanas", xp: 320 },
  { id: "n3", type: "course", title: "Curso: SQL — Fundamentos", detail: "Trilha em andamento · missão 3 de 4", status: "in_progress", eta: "~1 semana", xp: 640 },
  { id: "n4", type: "project", title: "Projeto: análise de vendas", detail: "Dataset de varejo · correção por mentor", status: "todo", eta: "~1 semana", xp: 120 },
  { id: "n5", type: "hackathon", title: "Hackathon: previsão de churn", detail: "Patrocinado pela Nubank", status: "todo", eta: "12 dias", xp: 500 },
  { id: "n6", type: "skill", title: "Python para dados", detail: "pandas + seaborn", status: "todo", eta: "~3 semanas", xp: 400 },
]

export type Ebook = {
  id: string
  title: string
  author: string
  category: string
  pages: number
  readPages: number
  readingHours: number
  status: "lendo" | "concluido" | "novo"
}

export const EBOOK_CATEGORIES = [
  "SQL & Bancos",
  "Python & Dados",
  "Estatística & ML",
  "Excel & BI",
  "Carreira & Mercado",
  "Soft Skills",
] as const

const EBOOK_TITLES: Record<(typeof EBOOK_CATEGORIES)[number], { t: string; a: string }[]> = {
  "SQL & Bancos": [
    { t: "SQL Descomplicado", a: "Rodolfo Almeida" },
    { t: "Índices e Performance em Postgres", a: "Equipe Tropa" },
    { t: "Window Functions na Prática", a: "Mariana Costa" },
    { t: "Modelagem Relacional do Zero", a: "Equipe Tropa" },
    { t: "Banco de Dados para Analistas", a: "Rafael Teixeira" },
    { t: "CTEs e Subqueries Sem Dor", a: "Equipe Tropa" },
    { t: "SQL para Entrevistas", a: "Beatriz Lima" },
    { t: "NoSQL vs Relacional", a: "Equipe Tropa" },
    { t: "Otimizando Queries Lentas", a: "Diego Nogueira" },
    { t: "Trilha de Dados: SQL Intermediário", a: "Equipe Tropa" },
    { t: "Joins Explicados por Diagramas", a: "Mariana Costa" },
    { t: "Transações e Controle de Concorrência", a: "Equipe Tropa" },
    { t: "Data Warehousing com SQL", a: "Rafael Teixeira" },
    { t: "Comandos DDL e DML na Prática", a: "Equipe Tropa" },
    { t: "Particionamento de Tabelas", a: "Diego Nogueira" },
    { t: "SQL para Analistas de Marketing", a: "Beatriz Lima" },
    { t: "Exercícios de SQL — Vol. 1", a: "Equipe Tropa" },
    { t: "Exercícios de SQL — Vol. 2", a: "Equipe Tropa" },
  ],
  "Python & Dados": [
    { t: "Python para Análise de Dados", a: "Rodolfo Almeida" },
    { t: "pandas na Prática", a: "Mariana Costa" },
    { t: "Automazando Planilhas com Python", a: "Equipe Tropa" },
    { t: "NumPy Essencial", a: "Rafael Teixeira" },
    { t: "DataFrames sem Mistério", a: "Equipe Tropa" },
    { t: "Python: do Zero ao Dado", a: "Rodolfo Almeida" },
    { t: "Web Scraping para Dados", a: "Equipe Tropa" },
    { t: "Visualização com matplotlib e seaborn", a: "Beatriz Lima" },
    { t: "ETL Leve com Python", a: "Diego Nogueira" },
    { t: "Manipulação de Datas e Texto", a: "Equipe Tropa" },
    { t: "Boas Práticas de Código para Analistas", a: "Mariana Costa" },
    { t: "APIs: Coletando Dados Reais", a: "Equipe Tropa" },
    { t: "Desafios de Python — Vol. 1", a: "Equipe Tropa" },
    { t: "Desafios de Python — Vol. 2", a: "Equipe Tropa" },
    { t: "Automatize Sua Rotina de BI", a: "Rodolfo Almeida" },
    { t: "Introdução a Repositórios e Git", a: "Equipe Tropa" },
    { t: "Análise Exploratória Passo a Passo", a: "Beatriz Lima" },
    { t: "Storytelling com Dados em Python", a: "Mariana Costa" },
  ],
  "Estatística & ML": [
    { t: "Estatística Aplicada a Dados", a: "Rodolfo Almeida" },
    { t: "Distribuições Essenciais", a: "Equipe Tropa" },
    { t: "Testes de Hipótese na Prática", a: "Rafael Teixeira" },
    { t: "Correlação não é Causalidade", a: "Beatriz Lima" },
    { t: "Regressão Linear de Verdade", a: "Equipe Tropa" },
    { t: "Amostragem e Amostras", a: "Mariana Costa" },
    { t: "Probabilidade para Data Science", a: "Equipe Tropa" },
    { t: "Machine Learning: Primeiros Passos", a: "Rodolfo Almeida" },
    { t: "Avaliando Modelos sem Enrolação", a: "Rafael Teixeira" },
    { t: "Overtuning e Validação Cruzada", a: "Equipe Tropa" },
    { t: "Classificação na Prática", a: "Mariana Costa" },
    { t: "Métricas que Importam", a: "Beatriz Lima" },
    { t: "A/B Testing para Analistas", a: "Equipe Tropa" },
    { t: "Estatística Inferencial", a: "Rodolfo Almeida" },
    { t: "Forecasting com Séries Temporais", a: "Equipe Tropa" },
    { t: "Regularização sem Medo", a: "Diego Nogueira" },
  ],
  "Excel & BI": [
    { t: "Excel de Analista de Dados", a: "Rodolfo Almeida" },
    { t: "Power Query na Prática", a: "Equipe Tropa" },
    { t: "Dashboards que Vendem Ideias", a: "Beatriz Lima" },
    { t: "Fórmulas Avançadas de Excel", a: "Equipe Tropa" },
    { t: "Tabelas Dinâmicas Sem Segredo", a: "Mariana Costa" },
    { t: "DAX Essencial para Analistas", a: "Equipe Tropa" },
    { t: "Power BI do Zero", a: "Rodolfo Almeida" },
    { t: "Modelagem Estrela no BI", a: "Rafael Teixeira" },
    { t: "Limpeza de Dados no Excel", a: "Equipe Tropa" },
    { t: "Pensamento Analítico com Planilhas", a: "Diego Nogueira" },
    { t: "Graficos que Contam História", a: "Beatriz Lima" },
    { t: "Excel VBA para Analistas", a: "Equipe Tropa" },
  ],
  "Carreira & Mercado": [
    { t: "Primeiro Emprego em Dados", a: "Rodolfo Almeida" },
    { t: "Construindo um Portfólio de Dados", a: "Equipe Tropa" },
    { t: "Como Passar na Entrevista de Dados", a: "Mariana Costa" },
    { t: "Freela de Dados: Comece Bem", a: "Equipe Tropa" },
    { t: "Salário de Dados no Brasil", a: "Rodolfo Almeida" },
    { t: "LinkedIn para Analistas", a: "Beatriz Lima" },
    { t: "Negociação de Oferta Sem Medo", a: "Equipe Tropa" },
    { t: "Migrando de Carreira para Dados", a: "Rodolfo Almeida" },
    { t: "Cases Reais de Contratação", a: "Equipe Tropa" },
    { t: "Checklist: Vaga de Analista Pleno", a: "Mariana Costa" },
  ],
  "Soft Skills": [
    { t: "Comunicação Clara com Stakeholders", a: "Equipe Tropa" },
    { t: "Pensamento Crítico Aplicado a Dados", a: "Rodolfo Almeida" },
    { t: "Trabalho em Equipe em Squads", a: "Equipe Tropa" },
    { t: "Como Apresentar Resultados", a: "Beatriz Lima" },
    { t: "Gestão do Tempo para Estudos", a: "Mariana Costa" },
    { t: "Feedback: Receba e Ofereça", a: "Equipe Tropa" },
    { t: "Liderança Técnica Inicial", a: "Rodolfo Almeida" },
    { t: "Resolução de Problemas com Dados", a: "Equipe Tropa" },
    { t: "Inglês para o Mercado de Dados", a: "Beatriz Lima" },
  ],
}

export const EBOOKS: Ebook[] = Object.entries(EBOOK_TITLES).flatMap(([category, list]) =>
  list.map((item, i) => {
    const read = i % 7 === 0
    const partial = i % 9 === 0
    return {
      id: `${category.replace(/[^a-z]/gi, "").toLowerCase()}-${i}`,
      title: item.t,
      author: item.a,
      category,
      pages: 40 + ((i * 23) % 120),
      readPages: read ? 0 : partial ? Math.floor(30 + ((i * 17) % 60)) : 0,
      readingHours: read ? 0 : partial ? 1 + (i % 3) : 0,
      status: partial ? ("lendo" as const) : ("novo" as const),
    }
  })
).map((b) => ({ ...b, status: b.readPages >= b.pages ? ("concluido" as const) : b.status }))

export const LIBRARY_STATS = {
  total: EBOOKS.length,
  reading: EBOOKS.filter((b) => b.status === "lendo").length,
  done: EBOOKS.filter((b) => b.status === "concluido").length,
  hours: EBOOKS.filter((b) => b.status !== "novo").reduce((acc, b) => acc + b.readingHours + Math.round(b.readPages / 15), 0),
}

export const READING_CERTIFICATES = [
  {
    id: "c1",
    ebook: "Excel de Analista de Dados",
    hours: 6,
    date: "02/08/2026",
    status: "emitido",
  },
  {
    id: "c2",
    ebook: "Estatística Aplicada a Dados",
    hours: 4,
    date: "18/06/2026",
    status: "emitido",
  },
]

export type CvSection = {
  name: string
  score: number
  feedback: string
}

export const CV_REVIEW = {
  overall: 78,
  ats: 72,
  summary:
    "Perfil forte de negócio com base sólida em SQL. Para destravar vagas de dados, os próximos investimentos são: quantificar impacto, padronizar o formato e deixar os projetos mais técnicos no topo.",
  sections: [
    {
      name: "Formato",
      score: 85,
      feedback: "Layout limpo e escaneável. Áreas de destaque funcionam bem. Mantenha uma página.",
    },
    {
      name: "Impacto",
      score: 64,
      feedback: "Faltam números: substitua 'ajudei a reduzir custos' por 'reduzi 18% do custo de logística em 6 meses'.",
    },
    {
      name: "Palavras-chave",
      score: 76,
      feedback: "Bom uso de termos de dados (ETL, dashboard, KPIs). Adicione as ferramentas exatas usadas (SQL? qual SGBD?).",
    },
    {
      name: "Senioridade",
      score: 88,
      feedback: "Coerente com o nível Pleno. Experiência em BI e relacionamento com stakeholders fica evidente.",
    },
  ],
  improvements: [
    "Adicione métricas com valor absoluto (% ou R$) nas 3 principais entregas",
    "Liste ferramentas por experiência: especifique SGBD (Postgres/MySQL) e BI usado",
    "Mova o projeto de dados mais relevante para o topo da experiência",
    "Remova o objetivo genérico do início e use um headline técnico de 1 linha",
  ],
}