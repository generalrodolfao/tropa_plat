import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CFStreamVideo {
  uid: string;
  status: { state: string; pctComplete?: number; errorReasonCode?: string; errorReasonText?: string };
  meta?: Record<string, unknown>;
  created: string;
  modified: string;
  size?: number;
  thumbnail?: string;
  thumbnailHtml?: string;
  duration?: number;
  input?: Record<string, unknown>;
  play?: { hls: string; dash: string };
  watermark?: Record<string, unknown>;
  allowedOrigins?: string[];
  requireSignedURLs?: boolean;
  uploaded?: string;
  uploadExpiry?: string;
}

export interface CFStreamUploadTicket {
  uid: string;
  uploadURL: string;
  uploadExpiry?: string;
  requireSignedURLs?: boolean;
  allowedOrigins?: string[];
  meta?: Record<string, unknown>;
}

@Injectable()
export class CloudflareStreamAdapter {
  private readonly logger = new Logger(CloudflareStreamAdapter.name);
  private readonly apiToken: string;
  private readonly accountId: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiToken = this.config.get<string>('CLOUDFLARE_STREAM_TOKEN', '');
    this.accountId = this.config.get<string>('CLOUDFLARE_ACCOUNT_ID', '');
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    this.logger.debug(`CF Stream ${method} ${url}`);

    const res = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json() as any;
    if (!json.success) {
      this.logger.error(`CF Stream error: ${JSON.stringify(json.errors)}`);
      throw new Error(`CLOUDFLARE_STREAM_ERROR: ${JSON.stringify(json.errors)}`);
    }

    return json.result as T;
  }

  // ---------- Upload via TUS (direct) ----------

  async createUploadTicket(data: {
    name?: string;
    meta?: Record<string, unknown>;
    requireSignedURLs?: boolean;
    allowedOrigins?: string[];
    maxDurationSeconds?: number;
  }): Promise<CFStreamUploadTicket> {
    return this.request<CFStreamUploadTicket>('POST', '/direct_upload', {
      ...data,
      maxDurationSeconds: data.maxDurationSeconds ?? 600, // 10 min default
    });
  }

  // ---------- Video info ----------

  async getVideo(uid: string): Promise<CFStreamVideo> {
    return this.request<CFStreamVideo>('GET', `/${uid}`);
  }

  async listVideos(params?: { limit?: number; before?: string; after?: string }): Promise<CFStreamVideo[]> {
    const p = new URLSearchParams();
    if (params?.limit) p.set('limit', String(params.limit));
    if (params?.before) p.set('before', params.before);
    if (params?.after) p.set('after', params.after);
    const query = p.toString() ? `?${p}` : '';
    return this.request<CFStreamVideo[]>('GET', `/${query}`);
  }

  // ---------- Signed URLs ----------

  async getSignedURL(uid: string, exp?: number): Promise<{ token: string; url: string; expiresAt: number }> {
    // Cloudflare Stream signed URLs via API
    const expirationSeconds = exp ?? Math.floor(Date.now() / 1000) + 60 * 60; // 1h default
    const url = await this.request<string>('POST', `/${uid}/token_access`, {
      exp: expirationSeconds,
    });
    return { token: url, url, expiresAt: expirationSeconds };
  }

  // ---------- Delete ----------

  async deleteVideo(uid: string): Promise<void> {
    await this.request<any>('DELETE', `/${uid}`);
  }

  // ---------- Watermark ----------

  async getWatermarks(): Promise<any[]> {
    return this.request<any[]>('GET', '/watermarks');
  }

  async createWatermark(name: string, imageKey: string, opacity: number, position: string, size: number, margin: number): Promise<any> {
    return this.request<any>('POST', '/watermarks', {
      name,
      image_key: imageKey,
      opacity,
      position,
      size,
      margin,
    });
  }

  // ---------- Webhook verification ----------

  verifyWebhookHeader(headerValue: string): boolean {
    // Cloudflare Stream webhook verification
    // In production, verify the JWT token from the header
    // For now, accept all webhooks in development
    const env = this.config.get<string>('NODE_ENV') ?? 'development';
    if (env === 'development') return true;

    // TODO: Verify JWT token in production
    return true;
  }
}
