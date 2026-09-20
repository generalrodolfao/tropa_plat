import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MailContent } from './email-templates';

/**
 * Envio de e-mail transacional via Resend (env-gated).
 * Sem RESEND_API_KEY apenas loga — útil em dev/test.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('RESEND_API_KEY') ?? '';
    this.from =
      this.config.get<string>('EMAIL_FROM') ??
      'Tropa dos Dados <no-reply@tropadosdados.com>';
    this.appUrl = (
      this.config.get<string>('WEB_APP_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  get enabled(): boolean {
    return this.apiKey.length > 0;
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn(
        `[email] RESEND_API_KEY ausente — não enviado: "${subject}" -> ${to}`,
      );
      return false;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: this.from, to: [to], subject, html }),
      });
      if (!res.ok) {
        this.logger.error(`[email] falha ${res.status}: ${await res.text()}`);
        return false;
      }
      this.logger.log(`[email] enviado "${subject}" -> ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`[email] erro: ${(err as Error).message}`);
      return false;
    }
  }

  async sendPasswordReset(to: string, token: string): Promise<boolean> {
    const link = `${this.appUrl}/login?resetToken=${encodeURIComponent(token)}`;
    return this.send(
      to,
      'Redefinição de senha — Tropa dos Dados',
      `<p>Recebemos um pedido para redefinir sua senha.</p>
       <p><a href="${link}">Definir nova senha</a> — o link é válido por 1 hora.</p>
       <p>Se não foi você, ignore este e-mail.</p>`,
    );
  }

  /** Envia o conteúdo de um template já pronto ({ subject, html }). */
  async sendTemplated(to: string, content: MailContent): Promise<boolean> {
    return this.send(to, content.subject, content.html);
  }

  /**
   * Fila manual: envio em lote tolerante a falhas (usado pelos jobs).
   * Retorna quantos e-mails partiram.
   */
  async sendBatch(
    items: Array<{ to: string; content: MailContent }>,
  ): Promise<number> {
    let sent = 0;
    for (const item of items) {
      // Resend aceita 2 req/s no plano free — espalhar para ser seguro
      const ok = await this.send(
        item.to,
        item.content.subject,
        item.content.html,
      );
      if (!ok) continue;
      sent++;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return sent;
  }
}

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
