import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMAdapter } from './llm.adapter';
import {
  CvParseDto,
  CvReviewDto,
  GeneratePdiDto,
  GenerateQuizItemsDto,
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
}
