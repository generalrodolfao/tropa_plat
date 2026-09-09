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
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

@Injectable()
export class LLMAdapter {
  private readonly logger = new Logger(LLMAdapter.name);
  private readonly openaiKey: string;
  private readonly geminiKey: string;
  private readonly openaiBaseUrl = 'https://api.openai.com/v1';
  private readonly geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  // Circuit breaker
  private failures = 0;
  private lastFailure = 0;
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerResetMs = 60000; // 1 min

  constructor(private readonly config: ConfigService) {
    this.openaiKey = this.config.get<string>('OPENAI_API_KEY') ?? '';
    this.geminiKey = this.config.get<string>('GEMINI_API_KEY') ?? '';
  }

  private get isCircuitOpen(): boolean {
    if (this.failures < this.circuitBreakerThreshold) return false
    if (Date.now() - this.lastFailure > this.circuitBreakerResetMs) {
      this.failures = 0
      return false
    }
    return true
  }

  private recordFailure(): void {
    this.failures++
    this.lastFailure = Date.now()
  }

  private recordSuccess(): void {
    this.failures = 0
  }

  // ---------- Primary: OpenAI ----------

  async chatOpenAI(request: LLMRequest): Promise<LLMResponse> {
    if (this.isCircuitOpen) throw new Error('CIRCUIT_BREAKER_OPEN')

    const body: any = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    }

    if (request.responseFormat) {
      body.response_format = request.responseFormat
    }

    const res = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      this.recordFailure()
      const error = await res.text()
      throw new Error(`OPENAI_ERROR_${res.status}: ${error}`)
    }

    this.recordSuccess()
    const json = await res.json()
    return {
      content: json.choices[0].message.content,
      model: json.model,
      usage: {
        promptTokens: json.usage.prompt_tokens,
        completionTokens: json.usage.completion_tokens,
        totalTokens: json.usage.total_tokens,
      },
    }
  }

  // ---------- Fallback: Gemini ----------

  async chatGemini(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model.replace('gpt-', '')
    const url = `${this.geminiBaseUrl}/models/${model}:generateContent?key=${this.geminiKey}`

    const body: any = {
      contents: request.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
      },
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      this.recordFailure()
      const error = await res.text()
      throw new Error(`GEMINI_ERROR_${res.status}: ${error}`)
    }

    this.recordSuccess()
    const json = await res.json()
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return {
      content,
      model,
      usage: {
        promptTokens: json.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: json.usageMetadata?.totalTokenCount ?? 0,
      },
    }
  }

  // ---------- Router: OpenAI primary, Gemini fallback ----------

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      return await this.chatOpenAI(request)
    } catch (error: any) {
      this.logger.warn(`OpenAI failed, trying Gemini: ${error.message}`)
      try {
        return await this.chatGemini(request)
      } catch (geminiError: any) {
        this.logger.error(`Both providers failed: ${error.message} / ${geminiError.message}`)
        throw new Error('ALL_LLM_PROVIDERS_FAILED')
      }
    }
  }

  // ---------- Structured Output ----------

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
          schema,
        },
      },
    })

    return JSON.parse(response.content) as T
  }
}
