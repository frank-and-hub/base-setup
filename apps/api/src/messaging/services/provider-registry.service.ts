import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailProviderInterface } from '../adapters/email-provider.interface';
import { SmtpEmailProvider } from '../adapters/smtp-email.provider';
import { SendGridEmailProvider } from '../adapters/sendgrid-email.provider';
import { PrescaledSmtpProvider, PRESET_SMTP_PROVIDERS } from '../adapters/prescaled-smtp.provider';

@Injectable()
export class ProviderRegistryService {
  private readonly adapters = new Map<string, EmailProviderInterface>();

  constructor(
    private readonly smtpProvider: SmtpEmailProvider,
    private readonly sendgridProvider: SendGridEmailProvider,
  ) {
    this.registerAdapter(this.smtpProvider);
    this.registerAdapter(this.sendgridProvider);

    // Register all preset SMTP email providers so they are immediately fully functional!
    for (const slug of Object.keys(PRESET_SMTP_PROVIDERS)) {
      this.registerAdapter(new PrescaledSmtpProvider(this.smtpProvider, slug));
    }
  }

  registerAdapter(adapter: EmailProviderInterface) {
    this.adapters.set(adapter.slug.toLowerCase(), adapter);
  }

  getAdapter(slug: string): EmailProviderInterface {
    const adapter = this.adapters.get(slug.toLowerCase());
    if (!adapter) {
      throw new NotFoundException(`Provider adapter '${slug}' is not registered or not yet supported.`);
    }
    return adapter;
  }

  hasAdapter(slug: string): boolean {
    return this.adapters.has(slug.toLowerCase());
  }

  getSupportedSlugs(): string[] {
    return Array.from(this.adapters.keys());
  }
}
