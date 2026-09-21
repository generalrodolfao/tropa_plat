import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMAdapter } from './llm.adapter';
import {
  CvParseDto,
  CvReviewDto,
  DiagnosticQuizDto,
  GeneratePdiDto,
  GenerateQuizItemsDto,
  SummarizeHighlightsDto,
} from './dto/ai.dto';
import { createHash } from 'crypto';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly cache = new Map<string, { data: any; expiresAt: number }>();
  private readonly cacheTtlMs = 60 * 60 * 1000; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LLMAdapter,
  ) {}

  // ---------- Guardrails ----------

  private redactPII(text: string): string {
    // Redact CPF, email, telefone, endereço
    return text
      .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[REDACTED_CPF]')
      .replace(/\b\d{11}\b/g, '[REDACTED_CPF]')
      .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[REDACTED_EMAIL]')
      .replace(/\b\(\d{2}\)\s?\d{4,5}-\d{4}\b/g, '[REDACTED_PHONE]')
      .replace(/\b\d{5}-\d{3}\b/g, '[REDACTED_CEP]');
  }

  private getCacheKey(prefix: string, data: string): string {
    return `${prefix}:${createHash('sha256').update(data).digest('hex').slice(0, 16)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached || cached.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, expiresAt: Date.now() + this.cacheTtlMs });
  }

  // ---------- CV Parse ----------

  async parseCV(dto: CvParseDto): Promise<{
    name: string;
    email: string;
    skills: Array<{ name: string; level: number; confidence: number }>;
    experience: Array<{
      role: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{ degree: string; institution: string; year: string }>;
    summary: string;
  }> {
    const cacheKey = this.getCacheKey('cv_parse', dto.text);
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const redactedText = this.redactPII(dto.text);

    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        skills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              level: { type: 'number', minimum: 0, maximum: 5 },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['name', 'level', 'confidence'],
          },
        },
        experience: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              company: { type: 'string' },
              duration: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['role', 'company', 'duration', 'description'],
          },
        },
        education: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              degree: { type: 'string' },
              institution: { type: 'string' },
              year: { type: 'string' },
            },
            required: ['degree', 'institution', 'year'],
          },
        },
        summary: { type: 'string' },
      },
      required: [
        'name',
        'email',
        'skills',
        'experience',
        'education',
        'summary',
      ],
    };

    const result = await this.llm.structuredOutput<any>(
      [
        {
          role: 'system',
          content: `Você é um parser de CV especializado em dados de tecnologia e dados.
Analise o CV extraído e retorne um JSON estruturado com:
- name: nome completo
- email: email (se visível, senão vazio)
- skills: lista de skills com nível estimado (0-5) e confiança (0-1)
- experience: experiências profissionais
- education: formação acadêmica
- summary: resumo profissional em 2-3 frases

Nível de skill:
0 = nenhum conhecimento
1 = básico (conceitos)
2 = iniciante (faz tarefas simples)
3 = intermediário (dependente)
4 = avançado (independente)
5 = expert (lidera)

Foque em skills de dados: SQL, Python, R, Excel, Power BI, Tableau, Estatística, Machine Learning, etc.`,
        },
        {
          role: 'user',
          content: `Extraia o CV:\n\n${redactedText}`,
        },
      ],
      schema,
      'gpt-4o-mini',
    );

    this.setCache(cacheKey, result);
    return result;
  }

  // ---------- CV Review ----------

  async reviewCV(dto: CvReviewDto): Promise<{
    overallScore: number;
    summary: string;
    sections: Array<{ title: string; score: number; feedback: string }>;
    atsScore: number;
    strengths: string[];
    improvements: string[];
  }> {
    const cacheKey = this.getCacheKey(
      'cv_review',
      dto.cvText + (dto.targetRole ?? ''),
    );
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const redactedText = this.redactPII(dto.cvText);

    const schema = {
      type: 'object',
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        summary: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 100 },
              feedback: { type: 'string' },
            },
            required: ['title', 'score', 'feedback'],
          },
        },
        atsScore: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
      },
      required: [
        'overallScore',
        'summary',
        'sections',
        'atsScore',
        'strengths',
        'improvements',
      ],
    };

    const targetRole = dto.targetRole ?? 'Profissional de Dados';

    const result = await this.llm.structuredOutput<any>(
      [
        {
          role: 'system',
          content: `Você é um especialista em revisão de CV para a área de dados.
Analise o CV e forneça:
- overallScore: nota geral (0-100)
- summary: resumo da avaliação
- sections: avaliação por seção (Contato, Experiência, Skills, Formação, Projetos)
- atsScore: compatibilidade com sistemas de tracking (ATS)
- strengths: pontos fortes
- improvements: melhorias sugeridas

Considere o cargo alvo: ${targetRole}
Seja específico e prático nas sugestões.`,
        },
        {
          role: 'user',
          content: `Revise este CV para o cargo de ${targetRole}:\n\n${redactedText}`,
        },
      ],
      schema,
      'gpt-4o-mini',
    );

    this.setCache(cacheKey, result);
    return result;
  }

  // ---------- Summarize Highlights ----------

  async summarizeHighlights(dto: SummarizeHighlightsDto): Promise<{
    title: string;
    summary: string;
    keyPoints: string[];
    suggestions: string;
  }> {
    const valid = (dto.highlights ?? [])
      .map((h) => (typeof h.text === 'string' ? h.text : '').trim())
      .filter((t) => t.length > 0);

    if (valid.length === 0) {
      return {
        title: 'Sem grifos ainda',
        summary:
          'Grifou algum trecho? Selecione um texto nas páginas do livro para gerar o resumo aqui.',
        keyPoints: [],
        suggestions: '',
      };
    }

    const cacheKey = this.getCacheKey(
      'hl',
      `${dto.source ?? ''}|${valid.join('|')}`,
    );
    const cached = this.getFromCache<{
      title: string;
      summary: string;
      keyPoints: string[];
      suggestions: string;
    }>(cacheKey);
    if (cached) return cached;

    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'string' },
      },
      required: ['title', 'summary', 'keyPoints', 'suggestions'],
    };

    const excerpts = valid.map((t, i) => `${i + 1}. "${t}"`).join('\n');

    const result = await this.llm.structuredOutput<{
      title: string;
      summary: string;
      keyPoints: string[];
      suggestions: string;
    }>(
      [
        {
          role: 'system',
          content: `Você é um tutor de estudos da Tropa dos Dados.
Sintetize os trechos grifados por um aluno${dto.source ? ` de "${dto.source}"` : ''}.
Responda em português. Seja conciso e direto, como um resumo de revisão.`,
        },
        {
          role: 'user',
          content: `Trechos grifados:\n${excerpts}`,
        },
      ],
      schema,
      'gpt-4o-mini',
    );

    this.setCache(cacheKey, result);
    return result;
  }

  // ---------- Generate PDI ----------

  async generatePDI(dto: GeneratePdiDto): Promise<{
    milestones: Array<{
      title: string;
      description: string;
      skills: string[];
      estimatedWeeks: number;
      courses: Array<{ title: string; reason: string }>;
      projects: Array<{ title: string; description: string }>;
    }>;
    totalWeeks: number;
    weeklyHours: number;
  }> {
    const skills = JSON.parse(dto.currentSkills) as Array<{
      skillId: string;
      level: number;
    }>;

    const schema = {
      type: 'object',
      properties: {
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              estimatedWeeks: { type: 'number' },
              courses: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    reason: { type: 'string' },
                  },
                  required: ['title', 'reason'],
                },
              },
              projects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                  },
                  required: ['title', 'description'],
                },
              },
            },
            required: [
              'title',
              'description',
              'skills',
              'estimatedWeeks',
              'courses',
              'projects',
            ],
          },
        },
        totalWeeks: { type: 'number' },
        weeklyHours: { type: 'number' },
      },
      required: ['milestones', 'totalWeeks', 'weeklyHours'],
    };

    const skillsText = skills
      .map((s) => `- Skill ${s.skillId}: nível ${s.level}/5`)
      .join('\n');

    const result = await this.llm.structuredOutput<any>(
      [
        {
          role: 'system',
          content: `Você é um mentor de carreira especializado em dados.
Crie um PDI (Plano de Desenvolvimento Individual) personalizado.

Skills atuais do aluno:
${skillsText}

Estilo de aprendizado: ${dto.learningStyle ?? 'não definido'}
Horas por semana: ${dto.hoursPerWeek ?? 5}
Objetivo: ${dto.objective}

Crie milestones progressivos (3-6), cada um com:
- Título e descrição
- Skills a desenvolver
- Semanas estimadas
- Cursos recomendados (título + por quê)
- Projetos práticos (título + descrição)

Seja realista com o tempo disponível.`,
        },
        {
          role: 'user',
          content: `Gere o PDI para: ${dto.objective}`,
        },
      ],
      schema,
      'gpt-4o',
    );

    return result;
  }

  // ---------- Generate Quiz Items ----------

  async generateQuizItems(dto: GenerateQuizItemsDto): Promise<
    Array<{
      prompt: string;
      options: string[];
      correctIndex: number;
      difficulty: number;
      explanation: string;
    }>
  > {
    const schema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prompt: { type: 'string' },
              options: {
                type: 'array',
                items: { type: 'string' },
                minItems: 4,
                maxItems: 4,
              },
              correctIndex: { type: 'number', minimum: 0, maximum: 3 },
              difficulty: { type: 'number', minimum: 1, maximum: 5 },
              explanation: { type: 'string' },
            },
            required: [
              'prompt',
              'options',
              'correctIndex',
              'difficulty',
              'explanation',
            ],
          },
        },
      },
      required: ['items'],
    };

    const result = await this.llm.structuredOutput(
      [
        {
          role: 'system',
          content: `Gere ${dto.count} perguntas de quiz para avaliar a skill.
Dificuldade alvo: ${dto.targetDifficulty}/5
Formato: múltipla escolha com 4 opções.
Inclua explicação para cada resposta.`,
        },
        {
          role: 'user',
          content: `Gere perguntas para a skill: ${dto.skillId}`,
        },
      ],
      schema,
      'gpt-4o-mini',
    );

    return (result as any).items ?? [];
  }

  // ---------- Onboarding: Quiz diagnóstico multi-skill ----------

  async generateDiagnosticQuiz(dto: DiagnosticQuizDto): Promise<{
    skills: Array<{
      skillId: string;
      questions: Array<{
        prompt: string;
        options: string[];
        correctIndex: number;
        difficulty: number;
        explanation: string;
      }>;
    }>;
  }> {
    const skills =
      dto.skills && dto.skills.length > 0
        ? dto.skills
        : ['sql', 'python', 'statistics', 'excel'];
    const perSkill = Math.min(Math.max(dto.questionsPerSkill ?? 3, 1), 5);

    const schema = {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skillId: { type: 'string' },
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string' },
                    options: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 4,
                      maxItems: 4,
                    },
                    correctIndex: { type: 'number', minimum: 0, maximum: 3 },
                    difficulty: { type: 'number', minimum: 1, maximum: 5 },
                    explanation: { type: 'string' },
                  },
                  required: [
                    'prompt',
                    'options',
                    'correctIndex',
                    'difficulty',
                    'explanation',
                  ],
                },
              },
            },
            required: ['skillId', 'questions'],
          },
        },
      },
      required: ['skills'],
    };

    const wanted = skills
      .map((s) => `- ${s} (${perSkill} perguntas)`)
      .join('\n');

    const result = await this.llm.structuredOutput<any>(
      [
        {
          role: 'system',
          content: `Você monta um quiz diagnóstico de nivelamento em dados.
Gere exatamente ${perSkill} perguntas de múltipla escolha (4 opções) para cada skill listada.
Comece pelo nível mais básico e suba a dificuldade (1 a 5).
Use exatamente os skillId fornecidos.
Inclua a explicação da resposta correta.`,
        },
        {
          role: 'user',
          content: `Skills a avaliar:\n${wanted}`,
        },
      ],
      schema,
      'gpt-4o-mini',
    );

    return { skills: result?.skills ?? [] };
  }

  // ---------- Camps: gerar itens de treino ----------

  async generateCampItems(dto: {
    campTitle: string;
    category: string;
    format: string;
    count: number;
    difficulty: number;
  }): Promise<
    Array<{
      prompt: string;
      options?: string[];
      correctIndex?: number;
      answerKey?: string;
      explanation?: string;
      difficulty: number;
    }>
  > {
    const count = Math.min(Math.max(dto.count, 1), 12);
    const isQuiz = dto.format === 'quiz';

    const schema = isQuiz
      ? {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  prompt: { type: 'string' },
                  options: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 4,
                    maxItems: 4,
                  },
                  correctIndex: { type: 'number', minimum: 0, maximum: 3 },
                  explanation: { type: 'string' },
                  difficulty: { type: 'number', minimum: 1, maximum: 5 },
                },
                required: [
                  'prompt',
                  'options',
                  'correctIndex',
                  'explanation',
                  'difficulty',
                ],
              },
            },
          },
          required: ['items'],
        }
      : {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  prompt: { type: 'string' },
                  answerKey: { type: 'string' },
                  explanation: { type: 'string' },
                  difficulty: { type: 'number', minimum: 1, maximum: 5 },
                },
                required: ['prompt', 'answerKey', 'explanation', 'difficulty'],
              },
            },
          },
          required: ['items'],
        };

    const formatBrief: Record<string, string> = {
      quiz: 'perguntas de múltipla escolha (4 opções) com apenas 1 correta',
      exercise:
        'exercícios práticos abertos (ex.: escrever uma query SQL, um trecho de código Python ou uma análise)',
      interview:
        'perguntas abertas de entrevista técnica e comportamental, como um entrevistador faria',
      requirements:
        'cenários de negócio para levantamento de requisitos — o aluno deve fazer perguntas e/ou propor requisitos',
      hotseat:
        'perguntas curtas e diretas estilo sabatina (hotseat), para resposta rápida e objetiva',
    };

    const result = await this.llm.structuredOutput<any>(
      [
        {
          role: 'system',
          content: `Você é o instrutor responsável pelo "${dto.campTitle}" na Tropa dos Dados (área: ${dto.category}).
Gere exatamente ${count} itens de treino do formato: ${formatBrief[dto.format] ?? dto.format}.
Dificuldade alvo: ${dto.difficulty}/5.
Regras:
- Conteúdo original, em português, sem repetir itens.
- Para itens abertos, "answerKey" deve conter a resposta/roteiro esperado (gabarito) para correção.
- "explanation" traz o porquê/contexto.
- No formato quiz, "explanation" explica por que a alternativa correta está certa.`,
        },
        {
          role: 'user',
          content: `Gere ${count} itens para o camp "${dto.campTitle}" (${dto.category}), dificuldade ${dto.difficulty}/5.`,
        },
      ],
      schema,
      'gpt-4o-mini',
    );

    const items = (result?.items ?? []) as any[];
    return items
      .filter(
        (it) =>
          it && typeof it.prompt === 'string' && it.prompt.trim().length > 0,
      )
      .map((it) => ({
        prompt: String(it.prompt).trim(),
        options: Array.isArray(it.options) ? it.options.map(String) : undefined,
        correctIndex:
          typeof it.correctIndex === 'number' ? it.correctIndex : undefined,
        answerKey: typeof it.answerKey === 'string' ? it.answerKey : undefined,
        explanation:
          typeof it.explanation === 'string' ? it.explanation : undefined,
        difficulty:
          typeof it.difficulty === 'number' ? it.difficulty : dto.difficulty,
      }));
  }

  // ---------- Camps: corrigir resposta aberta ----------

  async gradeCampAnswer(dto: {
    campTitle: string;
    format: string;
    prompt: string;
    answerKey?: string;
    answer: string;
  }): Promise<{ score: number; correct: boolean; feedback: string }> {
    const answer = (dto.answer ?? '').trim();
    if (answer.length === 0) {
      return {
        score: 0,
        correct: false,
        feedback:
          'Resposta em branco. Tente responder mesmo que parcialmente para receber feedback.',
      };
    }

    const schema = {
      type: 'object',
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        correct: { type: 'boolean' },
        feedback: { type: 'string' },
      },
      required: ['score', 'correct', 'feedback'],
    };

    const result = await this.llm.structuredOutput<{
      score: number;
      correct: boolean;
      feedback: string;
    }>(
      [
        {
          role: 'system',
          content: `Você corrige respostas do "${dto.campTitle}" na Tropa dos Dados (formato: ${dto.format}).
Avalie a resposta do aluno de 0 a 100 conforme o gabarito/rubrica, considerando correção, completude e clareza.
Use "correct": true quando a nota for maior ou igual a 60.
Feedback em português, direto, com 1 ponto forte e 1 ponto a melhorar quando possível.`,
        },
        {
          role: 'user',
          content: `Pergunta: ${dto.prompt}\n\nGabarito/rubrica: ${dto.answerKey ?? '(não informado)'}\n\nResposta do aluno: ${answer}`,
        },
      ],
      schema,
      'gpt-4o-mini',
    );

    const score = Math.min(
      100,
      Math.max(0, Math.round(Number((result as any)?.score ?? 0))),
    );
    return {
      score,
      correct:
        typeof (result as any)?.correct === 'boolean'
          ? (result as any).correct
          : score >= 60,
      feedback: (result as any)?.feedback ?? '',
    };
  }

  // ---------- Camps: resumo geral da sessão ----------

  async summarizeCampSession(dto: {
    campTitle: string;
    score: number;
    items: Array<{ prompt: string; score: number; format: string }>;
  }): Promise<{
    headline: string;
    summary: string;
    strengths: string[];
    improvements: string[];
  }> {
    const schema = {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        summary: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
      },
      required: ['headline', 'summary', 'strengths', 'improvements'],
    };

    const lines = dto.items
      .map(
        (it, i) =>
          `${i + 1}. [${it.format}] ${it.prompt} — nota ${it.score}/100`,
      )
      .join('\n');

    const result = await this.llm.structuredOutput<{
      headline: string;
      summary: string;
      strengths: string[];
      improvements: string[];
    }>(
      [
        {
          role: 'system',
          content: `Você é coach da Tropa dos Dados. Resuma o desempenho do aluno no "${dto.campTitle}" (nota final ${dto.score}/100).
Responda em português, com tom direto e motivador. Aponte forças e o que treinar a seguir.`,
        },
        {
          role: 'user',
          content: `Desempenho por item:\n${lines || '(sem itens respondidos)'}`,
        },
      ],
      schema,
      'gpt-4o-mini',
    );

    return {
      headline: (result as any)?.headline ?? 'Sessão concluída',
      summary: (result as any)?.summary ?? '',
      strengths: (result as any)?.strengths ?? [],
      improvements: (result as any)?.improvements ?? [],
    };
  }
}
