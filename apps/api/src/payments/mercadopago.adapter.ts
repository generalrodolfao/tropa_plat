import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MPCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: { number: string };
  identification?: { type: string; number: string };
  address?: { zip_code: string; street_name: string; street_number: number };
  external_reference?: string;
}

export interface MPCardToken {
  id: string;
  first_six_digits: string;
  last_four_digits: string;
  expiration_month: number;
  expiration_year: number;
  cardholder: {
    name: string;
    identification: { type: string; number: string };
  };
}

export interface MPSubscription {
  id: string;
  payer_id: number;
  external_reference: string;
  reason: string;
  auto_recurring: {
    frequency: number;
    frequency_type: 'months' | 'days';
    transaction_amount: number;
    currency_id: string;
  };
  status: string;
  init_point: string;
  next_payment_date?: string;
}

export interface MPPayment {
  id: number;
  status: string;
  status_detail: string;
  payment_type_id: string;
  payment_method_id: string;
  transaction_amount: number;
  description: string;
  external_reference: string;
  date_created: string;
  date_approved?: string;
  payer: { id: number; email: string };
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MercadoPagoAdapter {
  private readonly logger = new Logger(MercadoPagoAdapter.name);
  private readonly baseUrl = 'https://api.mercadopago.com';
  private readonly accessToken: string;

  constructor(private readonly config: ConfigService) {
    this.accessToken = this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN', '');
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    this.logger.debug(`MP ${method} ${url}`);

    const res = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    if (!res.ok) {
      this.logger.error(`MP error ${res.status}: ${text}`);
      throw new Error(`MERCADOPAGO_ERROR_${res.status}`);
    }

    return JSON.parse(text) as T;
  }

  // ---------- Customers ----------

  async createCustomer(data: {
    email: string;
    name: string;
    externalReference?: string;
  }): Promise<MPCustomer> {
    return this.request<MPCustomer>('POST', '/v1/customers', {
      email: data.email,
      first_name: data.name.split(' ')[0],
      last_name: data.name.split(' ').slice(1).join(' ') || undefined,
      external_reference: data.externalReference,
    });
  }

  async getCustomer(customerId: string): Promise<MPCustomer> {
    return this.request<MPCustomer>('GET', `/v1/customers/${customerId}`);
  }

  // ---------- Card Tokens ----------

  async createCardToken(data: {
    cardNumber: string;
    expirationMonth: number;
    expirationYear: number;
    securityCode: string;
    holderName: string;
    holderIdentificationType: string;
    holderIdentificationNumber: string;
  }): Promise<MPCardToken> {
    return this.request<MPCardToken>('POST', '/v1/card_tokens', {
      card_number: data.cardNumber,
      expiration_month: data.expirationMonth,
      expiration_year: data.expirationYear,
      security_code: data.securityCode,
      cardholder: {
        name: data.holderName,
        identification: {
          type: data.holderIdentificationType,
          number: data.holderIdentificationNumber,
        },
      },
    });
  }

  // ---------- Subscriptions ----------

  async createSubscription(data: {
    customerId: string;
    planId: string;
    cardTokenId?: string;
    paymentMethodId?: string;
  }): Promise<MPSubscription> {
    const body: Record<string, unknown> = {
      payer_id: Number(data.customerId),
      back_url: `${this.config.get<string>('APP_URL') ?? 'http://localhost:3000'}/app/pagamento/retorno`,
      external_reference: `sub_${data.customerId}_${Date.now()}`,
    };

    if (data.cardTokenId) {
      (body as any).card_token_id = data.cardTokenId;
      (body as any).payment_method_id = data.paymentMethodId;
    }

    return this.request<MPSubscription>(
      'POST',
      `/preapproval/${data.planId}`,
      body,
    );
  }

  async getSubscription(subscriptionId: string): Promise<MPSubscription> {
    return this.request<MPSubscription>(
      'GET',
      `/preapproval/${subscriptionId}`,
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<MPSubscription> {
    return this.request<MPSubscription>(
      'PUT',
      `/preapproval/${subscriptionId}`,
      {
        status: 'cancelled',
      },
    );
  }

  // ---------- Payments ----------

  async getPayment(paymentId: string): Promise<MPPayment> {
    return this.request<MPPayment>('GET', `/v1/payments/${paymentId}`);
  }

  // ---------- Plans ----------

  async createPlan(data: {
    name: string;
    amount: number;
    currencyId?: string;
    frequency: number;
    frequencyType: 'months' | 'days';
  }): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', '/v1/payment_methods/plans', {
      description: data.name,
      auto_recurring: {
        frequency: data.frequency,
        frequency_type: data.frequencyType,
        transaction_amount: data.amount,
        currency_id: data.currencyId ?? 'BRL',
      },
    });
  }
}
