import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import * as tls from 'tls';
import * as crypto from 'crypto';
import {
  EmailProviderInterface,
  EmailAttachmentPayload,
  ProviderCapability,
  SendEmailPayload,
  SendEmailResult,
} from './email-provider.interface';

@Injectable()
export class SmtpEmailProvider implements EmailProviderInterface {
  readonly slug = 'smtp';
  private readonly logger = new Logger(SmtpEmailProvider.name);

  async validateConfiguration(credentials: Record<string, any>): Promise<{ valid: boolean; error?: string }> {
    if (!credentials.host) return { valid: false, error: 'SMTP Host is required' };
    if (!credentials.port) return { valid: false, error: 'SMTP Port is required' };
    if (!credentials.auth_user) return { valid: false, error: 'SMTP Username is required' };
    if (!credentials.auth_password) return { valid: false, error: 'SMTP Password is required' };
    return { valid: true };
  }

  getCapabilities(): ProviderCapability {
    return {
      supports_html: true,
      supports_attachments: true,
      supports_template_variables: true,
      supports_cc_bcc: true,
      supports_delivery_tracking: false, // Standard SMTP does not support native webhook delivery receipts
      supports_open_tracking: false,
      supports_click_tracking: false,
    };
  }

  async testConnection(credentials: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const val = await this.validateConfiguration(credentials);
    if (!val.valid) return { success: false, message: val.error! };

    const host = credentials.host;
    const port = Number(credentials.port);
    const secure = credentials.secure === true || port === 465;

    return new Promise((resolve) => {
      let resolved = false;
      const timeoutMs = 8000;

      const finish = (success: boolean, message: string) => {
        if (!resolved) {
          resolved = true;
          try {
            socket.destroy();
          } catch (_) {}
          resolve({ success, message });
        }
      };

      const timer = setTimeout(() => {
        finish(false, `SMTP Connection timed out after ${timeoutMs}ms while connecting to ${host}:${port}`);
      }, timeoutMs);

      const onConnect = () => {
        clearTimeout(timer);
        finish(true, `Successfully established TCP connection with SMTP server ${host}:${port}`);
      };

      let socket: net.Socket;
      try {
        if (secure) {
          socket = tls.connect(
            {
              host,
              port,
              rejectUnauthorized: false,
            },
            onConnect,
          );
        } else {
          socket = net.connect({ host, port }, onConnect);
        }

        socket.on('error', (err: any) => {
          clearTimeout(timer);
          finish(false, `SMTP Socket Error: ${err.message || 'Unable to connect'}`);
        });
      } catch (err: any) {
        clearTimeout(timer);
        finish(false, `SMTP Client Error: ${err.message}`);
      }
    });
  }

  async sendEmail(credentials: Record<string, any>, payload: SendEmailPayload): Promise<SendEmailResult> {
    const host = credentials.host;
    const port = Number(credentials.port);
    const secure = credentials.secure === true || port === 465;
    const user = credentials.auth_user;
    const pass = credentials.auth_password;

    const messageId = `<${Date.now()}.${crypto.randomUUID()}@${host}>`;

    return new Promise((resolve) => {
      let resolved = false;
      const timeoutMs = 15000;

      const finish = (result: SendEmailResult) => {
        if (!resolved) {
          resolved = true;
          try {
            socket.destroy();
          } catch (_) {}
          resolve(result);
        }
      };

      const timer = setTimeout(() => {
        finish({
          success: false,
          error: `SMTP sending timed out after ${timeoutMs}ms`,
        });
      }, timeoutMs);

      let socket: net.Socket;

      const connectSocket = () => {
        if (secure) {
          return tls.connect({ host, port, rejectUnauthorized: false });
        } else {
          return net.connect({ host, port });
        }
      };

      try {
        socket = connectSocket();

        let stage = 'GREETING';
        let buffer = '';

        const sendCmd = (cmd: string) => {
          socket.write(cmd + '\r\n');
        };

        socket.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\r\n');
          // keep last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line) continue;
            const code = parseInt(line.substring(0, 3), 10);
            const isLast = line.charAt(3) !== '-';

            if (!isLast) continue; // Multi-line response continuation

            if (code >= 400) {
              clearTimeout(timer);
              return finish({
                success: false,
                error: `SMTP error at ${stage}: ${line}`,
              });
            }

            switch (stage) {
              case 'GREETING':
                stage = 'EHLO';
                sendCmd(`EHLO localhost`);
                break;

              case 'EHLO':
                stage = 'AUTH_LOGIN';
                sendCmd('AUTH LOGIN');
                break;

              case 'AUTH_LOGIN':
                stage = 'AUTH_USER';
                sendCmd(Buffer.from(user).toString('base64'));
                break;

              case 'AUTH_USER':
                stage = 'AUTH_PASS';
                sendCmd(Buffer.from(pass).toString('base64'));
                break;

              case 'AUTH_PASS':
                stage = 'MAIL_FROM';
                sendCmd(`MAIL FROM:<${payload.sender_email}>`);
                break;

              case 'MAIL_FROM':
                stage = 'RCPT_TO';
                // Send all recipient commands sequentially
                const allEmails = payload.recipients.map((r) => r.email);
                for (let i = 0; i < allEmails.length; i++) {
                  sendCmd(`RCPT TO:<${allEmails[i]}>`);
                }
                break;

              case 'RCPT_TO':
                stage = 'DATA';
                sendCmd('DATA');
                break;

              case 'DATA':
                stage = 'BODY';
                const mime = this.buildMimeMessage(payload, messageId);
                socket.write(mime + '\r\n.\r\n');
                break;

              case 'BODY':
                stage = 'QUIT';
                sendCmd('QUIT');
                clearTimeout(timer);
                return finish({
                  success: true,
                  provider_message_id: messageId,
                });
            }
          }
        });

        socket.on('error', (err: any) => {
          clearTimeout(timer);
          finish({
            success: false,
            error: `SMTP Socket Error: ${err.message}`,
          });
        });
      } catch (err: any) {
        clearTimeout(timer);
        finish({
          success: false,
          error: `SMTP Client Exception: ${err.message}`,
        });
      }
    });
  }

  private buildMimeMessage(payload: SendEmailPayload, messageId: string): string {
    const boundary = `boundary_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const altBoundary = `alt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    const toRecipients = payload.recipients.filter((r) => !r.type || r.type === 'TO');
    const ccRecipients = payload.recipients.filter((r) => r.type === 'CC');

    const headers: string[] = [
      `Message-ID: ${messageId}`,
      `Date: ${new Date().toUTCString()}`,
      `From: ${payload.sender_name} <${payload.sender_email}>`,
      `To: ${toRecipients.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', ')}`,
      `Subject: =?UTF-8?B?${Buffer.from(payload.subject).toString('base64')}?=`,
      `MIME-Version: 1.0`,
    ];

    if (payload.reply_to) {
      headers.push(`Reply-To: ${payload.reply_to}`);
    }

    if (ccRecipients.length > 0) {
      headers.push(`Cc: ${ccRecipients.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', ')}`);
    }

    const hasAttachments = payload.attachments && payload.attachments.length > 0;

    if (hasAttachments) {
      headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    } else {
      headers.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
    }

    const parts: string[] = [];

    if (hasAttachments) {
      parts.push(`--${boundary}`);
      parts.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n`);
    }

    // Text alternative
    parts.push(`--${altBoundary}`);
    parts.push(`Content-Type: text/plain; charset=UTF-8`);
    parts.push(`Content-Transfer-Encoding: base64\r\n`);
    parts.push(Buffer.from(payload.text_content || payload.subject).toString('base64'));

    // HTML alternative
    parts.push(`--${altBoundary}`);
    parts.push(`Content-Type: text/html; charset=UTF-8`);
    parts.push(`Content-Transfer-Encoding: base64\r\n`);
    parts.push(Buffer.from(payload.html_content).toString('base64'));
    parts.push(`--${altBoundary}--\r\n`);

    // Attachments
    if (hasAttachments) {
      for (const att of payload.attachments!) {
        parts.push(`--${boundary}`);
        parts.push(`Content-Type: ${att.content_type}; name="${att.filename}"`);
        parts.push(`Content-Disposition: attachment; filename="${att.filename}"`);
        parts.push(`Content-Transfer-Encoding: base64\r\n`);
        parts.push(att.content_base64);
      }
      parts.push(`--${boundary}--`);
    }

    return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`;
  }
}
