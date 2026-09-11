import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LLMRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string; json_schema?: any };
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class LLMAdapter {
  private readonly logger = new Logger(LLMAdapter.name);
  private readonly openrouterKey: string;
  private readonly openrouterBaseUrl: string;
  private readonly openrouterSiteUrl: string;
  private readonly openrouterAppName: string;
  private readonly openaiKey: string;
  private readonly geminiKey: string;
  private readonly openaiBaseUrl = 'https://api.openai.com/v1';
  private readonly geminiBaseUrl =
    'https://generativelanguage.googleapis.com/v1beta';

  // Mapeia nomes curtos usados na AIService para slugs do OpenRouter
  private static readonly OPENROUTER_MODEL_MAP: Record<string, string> = {
    'gpt-4o-mini': 'openai/gpt-4o-mini',
    'gpt-4o': 'openai/gpt-4o',
    'gemini-flash': 'google/gemini-flash-1.5',
    'gemini-flash-1.5': 'google/gemini-flash-1.5',
    'claude-sonnet': 'anthropic/claude-3.5-sonnet',
  };

  // Circuit breaker
  private failures = 0;
  private lastFailure = 0;
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerResetMs = 60000; // 1 min

  constructor(private readonly config: ConfigService) {
    this.openrouterKey = this.config.get<string>('OPENROUTER_API_KEY') ?? '';
    this.openrouterBaseUrl = (
      this.config.get<string>('OPENROUTER_BASE_URL') ??
      'https://openrouter.ai/api/v1'
    ).replace(/\/$/, '');
    this.openrouterSiteUrl =
      this.config.get<string>('OPENROUTER_SITE_URL') ?? '';
    this.openrouterAppName =
      this.config.get<string>('OPENROUTER_APP_NAME') ?? 'Tropa dos Dados';
    this.openaiKey = this.config.get<string>('OPENAI_API_KEY') ?? '';
    this.geminiKey = this.config.get<string>('GEMINI_API_KEY') ?? '';
  }

  private get isCircuitOpen(): boolean {
    if (this.failures < this.circuitBreakerThreshold) return false;
    if (Date.now() - this.lastFailure > this.circuitBreakerResetMs) {
      this.failures = 0;
      return false;
    }
    return true;
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
  }

  private recordSuccess(): void {
    this.failures = 0;
  }

  private modelForOpenRouter(model: string): string {
    if (model.includes('/')) return model;
    return (
      LLMAdapter.OPENROUTER_MODEL_MAP[model] ??
      this.config.get<string>('OPENROUTER_DEFAULT_MODEL') ??
      `openai/${model}`
    );
  }

  // ---------- Primary: OpenRouter (OpenAI-compatible) ----------

  async chatOpenRouter(request: LLMRequest): Promise<LLMResponse> {
    if (this.isCircuitOpen) throw new Error('CIRCUIT_BREAKER_OPEN');
    if (!this.openrouterKey) throw new Error('OPENROUTER_KEY_MISSING');

    const body: any = {
      model: this.modelForOpenRouter(request.model),
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    };

    if (request.responseFormat) {
      body.response_format = request.responseFormat;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.openrouterKey}`,
      'Content-Type': 'application/json',
      'X-Title': this.openrouterAppName,
    };
    if (this.openrouterSiteUrl)
      headers['HTTP-Referer'] = this.openrouterSiteUrl;

    const res = await fetch(`${this.openrouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      this.recordFailure();
      const error = await res.text();
      throw new Error(`OPENROUTER_ERROR_${res.status}: ${error}`);
    }

    this.recordSuccess();
    const json = await res.json();
    return {
      content: json.choices?.[0]?.message?.content ?? '',
      model: json.model ?? body.model,
      usage: {
        promptTokens: json.usage?.prompt_tokens ?? 0,
        completionTokens: json.usage?.completion_tokens ?? 0,
        totalTokens: json.usage?.total_tokens ?? 0,
      },
    };
  }

  // ---------- Fallback: OpenAI direto ----------

  async chatOpenAI(request: LLMRequest): Promise<LLMResponse> {
    if (this.isCircuitOpen) throw new Error('CIRCUIT_BREAKER_OPEN');
    if (!this.openaiKey) throw new Error('OPENAI_KEY_MISSING');

    const body: any = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    };

    if (request.responseFormat) {
      body.response_format = request.responseFormat;
    }

    const res = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      this.recordFailure();
      const error = await res.text();
      throw new Error(`OPENAI_ERROR_${res.status}: ${error}`);
    }

    this.recordSuccess();
    const json = await res.json();
    return {
      content: json.choices[0].message.content,
      model: json.model,
      usage: {
        promptTokens: json.usage.prompt_tokens,
        completionTokens: json.usage.completion_tokens,
        totalTokens: json.usage.total_tokens,
      },
    };
  }

  // ---------- Fallback: Gemini ----------

  async chatGemini(request: LLMRequest): Promise<LLMResponse> {
    if (!this.geminiKey) throw new Error('GEMINI_KEY_MISSING');

    const model = request.model.replace('gpt-', '');
    const url = `${this.geminiBaseUrl}/models/${model}:generateContent?key=${this.geminiKey}`;

    const body: any = {
      contents: request.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      this.recordFailure();
      const error = await res.text();
      throw new Error(`GEMINI_ERROR_${res.status}: ${error}`);
    }

    this.recordSuccess();
    const json = await res.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return {
      content,
      model,
      usage: {
        promptTokens: json.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: json.usageMetadata?.totalTokenCount ?? 0,
      },
    };
  }

  // ---------- Router: OpenRouter → OpenAI → Gemini ----------

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const providers: Array<{
      name: string;
      run: (req: LLMRequest) => Promise<LLMResponse>;
    }> = [];

    if (this.openrouterKey) {
      providers.push({
        name: 'OpenRouter',
        run: (r) => this.chatOpenRouter(r),
      });
    }
    if (this.openaiKey) {
      providers.push({ name: 'OpenAI', run: (r) => this.chatOpenAI(r) });
    }
    if (this.geminiKey) {
      providers.push({ name: 'Gemini', run: (r) => this.chatGemini(r) });
    }

    if (providers.length === 0) {
      throw new Error('NO_LLM_PROVIDER_CONFIGURED');
    }

    let lastError: unknown;
    for (const provider of providers) {
      try {
        return await provider.run(request);
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`${provider.name} failed: ${error.message}`);
      }
    }

    this.logger.error(`All LLM providers failed: ${String(lastError)}`);
    throw new Error('ALL_LLM_PROVIDERS_FAILED');
  }

  // ---------- Structured Output ----------

  /**
   * OpenAI/Azure exigem, no modo strict, `additionalProperties: false` em todo
   * objeto e que `required` liste todas as propriedades. Normalizamos o schema
   * aqui para não ter que repetir isso em cada serviço.
   */
  private toStrictSchema(node: any): any {
    if (Array.isArray(node))
      return node.map((item) => this.toStrictSchema(item));
    if (node && typeof node === 'object') {
      const out: Record<string, any> = {};
      for (const [key, value] of Object.entries(node)) {
        out[key] = this.toStrictSchema(value);
      }
      if (
        out.type === 'object' &&
        out.properties &&
        typeof out.properties === 'object'
      ) {
        out.additionalProperties = false;
        out.required = Object.keys(out.properties);
      }
      return out;
    }
    return node;
  }

  async structuredOutput<T>(
    messages: Array<{ role: string; content: string }>,
    schema: any,
    model = 'gpt-4o-mini',
  ): Promise<T> {
    const response = await this.chat({
      model,
      messages,
      temperature: 0.3,
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'response',
          strict: true,
          schema: this.toStrictSchema(schema),
        },
      },
    });

    return JSON.parse(response.content) as T;
  }
}
