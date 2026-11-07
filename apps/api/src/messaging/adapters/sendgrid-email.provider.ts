import { Injectable, Logger } from '@nestjs/common';
import {
  EmailProviderInterface,
  ProviderCapability,
  SendEmailPayload,
  SendEmailResult,
} from './email-provider.interface';

export interface SendGridCredentials {
  api_key: string;
  sender_name?: string;
  sender_email?: string;
  reply_to?: string;
}

@Injectable()
export class SendGridEmailProvider implements EmailProviderInterface {
  readonly slug = 'sendgrid';
  private readonly logger = new Logger(SendGridEmailProvider.name);
  private readonly baseUrl = 'https://api.sendgrid.com/v3';

  async validateConfiguration(credentials: Record<string, any>): Promise<{ valid: boolean; error?: string }> {
    if (!credentials.api_key || typeof credentials.api_key !== 'string') {
      return { valid: false, error: 'SendGrid API key is required and must be a string' };
    }

    if (!credentials.api_key.startsWith('SG.')) {
      return { valid: false, error: 'SendGrid API key typically starts with "SG."' };
    }

    return { valid: true };
  }

  async testConnection(credentials: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const val = await this.validateConfiguration(credentials);
    if (!val.valid) {
      return { success: false, message: val.error || 'Invalid configuration' };
    }

    try {
      // Validate by querying SendGrid API /v3/scopes or /v3/user/email
      const res = await fetch(`${this.baseUrl}/scopes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credentials.api_key}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 200) {
        return { success: true, message: 'SendGrid connection verified successfully.' };
      }

      if (res.status === 401) {
        return { success: false, message: 'SendGrid API key is unauthorized or invalid.' };
      }

      const body = await res.text();
      return {
        success: false,
        message: `SendGrid verification returned HTTP ${res.status}: ${body}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network error connecting to SendGrid API: ${err.message}`,
      };
    }
  }

  async sendEmail(
    credentials: Record<string, any>,
    payload: SendEmailPayload,
  ): Promise<SendEmailResult> {
    try {
      const toRecipients = payload.recipients
        .filter((r) => !r.type || r.type === 'TO')
        .map((r) => ({ email: r.email, name: r.name || undefined }));

      const ccRecipients = payload.recipients
        .filter((r) => r.type === 'CC')
        .map((r) => ({ email: r.email, name: r.name || undefined }));

      const bccRecipients = payload.recipients
        .filter((r) => r.type === 'BCC')
        .map((r) => ({ email: r.email, name: r.name || undefined }));

      if (toRecipients.length === 0) {
        return { success: false, error: 'No primary "TO" recipients provided' };
      }

      const personalizations: any[] = [
        {
          to: toRecipients,
          ...(ccRecipients.length > 0 ? { cc: ccRecipients } : {}),
          ...(bccRecipients.length > 0 ? { bcc: bccRecipients } : {}),
        },
      ];

      const content: any[] = [];
      if (payload.text_content) {
        content.push({
          type: 'text/plain',
          value: payload.text_content,
        });
      }
      if (payload.html_content) {
        content.push({
          type: 'text/html',
          value: payload.html_content,
        });
      }

      const attachments = (payload.attachments || []).map((att) => ({
        content: att.content_base64,
        type: att.content_type,
        filename: att.filename,
        disposition: 'attachment',
      }));

      const bodyPayload: any = {
        personalizations,
        from: {
          email: payload.sender_email,
          name: payload.sender_name || undefined,
        },
        subject: payload.subject,
        content: content.length > 0 ? content : [{ type: 'text/plain', value: ' ' }],
        ...(attachments.length > 0 ? { attachments } : {}),
        ...(payload.reply_to ? { reply_to: { email: payload.reply_to } } : {}),
        custom_args: payload.metadata || {},
      };

      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (response.status === 202 || response.status === 200) {
        const messageId = response.headers.get('x-message-id') || `sg_${Date.now()}`;
        return {
          success: true,
          provider_message_id: messageId,
          raw_response: { status: response.status },
        };
      }

      const errText = await response.text();
      let parsedErr: any;
      try {
        parsedErr = JSON.parse(errText);
      } catch {
        parsedErr = errText;
      }

      this.logger.error(`SendGrid send error: ${JSON.stringify(parsedErr)}`);
      return {
        success: false,
        error: typeof parsedErr === 'object' && parsedErr.errors
          ? parsedErr.errors.map((e: any) => e.message).join('; ')
          : errText,
        raw_response: parsedErr,
      };
    } catch (err: any) {
      this.logger.error(`SendGrid send exception: ${err.message}`, err.stack);
      return {
        success: false,
        error: err.message || 'Unknown SendGrid sending error',
      };
    }
  }

  getCapabilities(): ProviderCapability {
    return {
      supports_html: true,
      supports_attachments: true,
      supports_template_variables: true,
      supports_cc_bcc: true,
      supports_delivery_tracking: true,
      supports_open_tracking: true,
      supports_click_tracking: true,
    };
  }
}
