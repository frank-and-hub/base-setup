import { Injectable, Logger } from '@nestjs/common';
import {
  EmailProviderInterface,
  ProviderCapability,
  SendEmailPayload,
  SendEmailResult,
} from './email-provider.interface';
import { SmtpEmailProvider } from './smtp-email.provider';

export interface PrescaledSmtpConfig {
  slug: string;
  defaultHost: string;
  defaultPort: number;
  secure: boolean;
  notes?: string;
}

export const PRESET_SMTP_PROVIDERS: Record<string, PrescaledSmtpConfig> = {
  'amazon-ses': {
    slug: 'amazon-ses',
    defaultHost: 'email-smtp.us-east-1.amazonaws.com',
    defaultPort: 587,
    secure: false,
    notes: 'Amazon SES SMTP endpoint. Requires SES SMTP credentials (IAM).',
  },
  mailgun: {
    slug: 'mailgun',
    defaultHost: 'smtp.mailgun.org',
    defaultPort: 587,
    secure: false,
    notes: 'Mailgun SMTP endpoint. Default username is postmaster@yourdomain.com.',
  },
  'mailchimp-transactional': {
    slug: 'mailchimp-transactional',
    defaultHost: 'smtp.mandrillapp.com',
    defaultPort: 587,
    secure: false,
    notes: 'Mandrill / Mailchimp Transactional SMTP. Use API key as the password.',
  },
  brevo: {
    slug: 'brevo',
    defaultHost: 'smtp-relay.brevo.com',
    defaultPort: 587,
    secure: false,
    notes: 'Brevo (Sendinblue) SMTP relay.',
  },
  postmark: {
    slug: 'postmark',
    defaultHost: 'smtp.postmarkapp.com',
    defaultPort: 587,
    secure: false,
    notes: 'Postmark SMTP server. Use Server API Token for username and password.',
  },
  resend: {
    slug: 'resend',
    defaultHost: 'smtp.resend.com',
    defaultPort: 465,
    secure: true,
    notes: 'Resend SMTP service. Username is "resend" and password is API Key.',
  },
};

@Injectable()
export class PrescaledSmtpProvider implements EmailProviderInterface {
  readonly slug: string;
  private readonly logger: Logger;

  constructor(
    private readonly baseSmtp: SmtpEmailProvider,
    readonly providerSlug: string,
  ) {
    this.slug = providerSlug;
    this.logger = new Logger(`PrescaledSmtpProvider:${providerSlug}`);
  }

  async validateConfiguration(credentials: Record<string, any>): Promise<{ valid: boolean; error?: string }> {
    const preset = PRESET_SMTP_PROVIDERS[this.slug];
    const host = credentials.host || preset?.defaultHost;
    const port = credentials.port || preset?.defaultPort;

    if (!host) {
      return { valid: false, error: `${this.slug} SMTP Host is required` };
    }
    if (!port) {
      return { valid: false, error: `${this.slug} SMTP Port is required` };
    }
    if (!credentials.auth_user) {
      return { valid: false, error: 'SMTP Username / Access Key is required' };
    }
    if (!credentials.auth_password) {
      return { valid: false, error: 'SMTP Password / Secret Key is required' };
    }

    return { valid: true };
  }

  async testConnection(credentials: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const preset = PRESET_SMTP_PROVIDERS[this.slug];
    const effectiveCredentials = {
      ...credentials,
      host: credentials.host || preset?.defaultHost,
      port: Number(credentials.port || preset?.defaultPort),
      secure: credentials.secure !== undefined ? credentials.secure : preset?.secure ?? false,
    };

    return this.baseSmtp.testConnection(effectiveCredentials);
  }

  async sendEmail(credentials: Record<string, any>, payload: SendEmailPayload): Promise<SendEmailResult> {
    const preset = PRESET_SMTP_PROVIDERS[this.slug];
    const effectiveCredentials = {
      ...credentials,
      host: credentials.host || preset?.defaultHost,
      port: Number(credentials.port || preset?.defaultPort),
      secure: credentials.secure !== undefined ? credentials.secure : preset?.secure ?? false,
    };

    return this.baseSmtp.sendEmail(effectiveCredentials, payload);
  }

  getCapabilities(): ProviderCapability {
    return this.baseSmtp.getCapabilities();
  }
}
