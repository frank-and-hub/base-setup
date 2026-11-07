import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProviderConfigurationService } from './provider-configuration.service';
import { EmailTemplateService } from './email-template.service';
import { EmailQueueService } from './email-queue.service';
import {
  MessageSendingStatus,
  RecipientType,
  MessagingChannel,
} from '@prisma/client';
import {
  EmailRecipient,
  EmailAttachmentPayload,
  SendEmailPayload,
} from '../adapters/email-provider.interface';

export interface SendEmailDto {
  provider_configuration_uuid?: string;
  template_uuid?: string;
  template_variables?: Record<string, any>;
  recipients: Array<{
    email: string;
    name?: string;
    type?: 'TO' | 'CC' | 'BCC';
  }>;
  subject: string;
  html_content?: string;
  text_content?: string;
  sender_name?: string;
  sender_email?: string;
  reply_to?: string;
  attachments?: Array<{
    filename: string;
    content_type: string;
    content_base64: string;
  }>;
  scheduled_at?: string;
  send_async?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class EmailSendingService {
  private readonly logger = new Logger(EmailSendingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerConfigService: ProviderConfigurationService,
    private readonly templateService: EmailTemplateService,
    private readonly queueService: EmailQueueService,
  ) {}

  async prepareAndSendEmail(userUuid: string, dto: SendEmailDto) {
    if (!dto.recipients || dto.recipients.length === 0) {
      throw new BadRequestException('At least one recipient is required');
    }

    // Resolve Provider Configuration
    const { config, credentials, adapter } =
      await this.providerConfigService.getDecryptedConfiguration(
        userUuid,
        dto.provider_configuration_uuid,
        MessagingChannel.EMAIL,
      );

    // Resolve Template & Variables if provided
    let finalSubject = dto.subject;
    let finalHtml = dto.html_content || '';
    let finalText = dto.text_content || '';

    if (dto.template_uuid) {
      const template = await this.templateService.getTemplate(
        userUuid,
        dto.template_uuid,
      );
      finalSubject = this.templateService.renderContent(
        dto.subject || template.subject,
        dto.template_variables || {},
      );
      finalHtml = this.templateService.renderContent(
        template.html_content,
        dto.template_variables || {},
      );
      if (template.text_content) {
        finalText = this.templateService.renderContent(
          template.text_content,
          dto.template_variables || {},
        );
      }
    } else {
      if (dto.template_variables) {
        finalSubject = this.templateService.renderContent(
          finalSubject,
          dto.template_variables,
        );
        finalHtml = this.templateService.renderContent(
          finalHtml,
          dto.template_variables,
        );
        if (finalText) {
          finalText = this.templateService.renderContent(
            finalText,
            dto.template_variables,
          );
        }
      }
    }

    const senderEmail =
      dto.sender_email ||
      config.sender_email ||
      credentials.sender_email ||
      credentials.from_email ||
      'no-reply@antigravity.dev';

    const senderName =
      dto.sender_name ||
      config.sender_name ||
      credentials.sender_name ||
      'Antigravity Platform';

    const replyTo = dto.reply_to || config.reply_to || credentials.reply_to || undefined;

    // Create DB EmailMessage record
    const emailMessage = await this.prisma.emailMessage.create({
      data: {
        user_uuid: userUuid,
        provider_uuid: config.provider_uuid,
        configuration_uuid: config.configuration_uuid,
        template_uuid: dto.template_uuid || null,
        subject: finalSubject,
        sender_email: senderEmail,
        sender_name: senderName,
        reply_to: replyTo || null,
        html_content: finalHtml,
        text_content: finalText || null,
        status: dto.send_async ? MessageSendingStatus.QUEUED : MessageSendingStatus.PROCESSING,
        metadata: dto.metadata || {},
        recipients: {
          create: dto.recipients.map((r) => ({
            email: r.email,
            name: r.name || null,
            type: (r.type as RecipientType) || RecipientType.TO,
            status: MessageSendingStatus.QUEUED,
          })),
        },
        attachments: {
          create: (dto.attachments || []).map((att) => ({
            filename: att.filename,
            content_type: att.content_type,
            size_bytes: Math.round((att.content_base64.length * 3) / 4),
            content_base64: att.content_base64,
          })),
        },
      },
      include: {
        recipients: true,
        attachments: true,
      },
    });

    if (dto.send_async) {
      await this.queueService.enqueueEmailJob(emailMessage.message_uuid, userUuid);
      return {
        message: 'Email queued for delivery',
        email_message: emailMessage,
      };
    }

    // Direct synchronous dispatch
    return this.dispatchEmail(emailMessage.message_uuid, userUuid, dto.attachments);
  }

  async dispatchEmail(
    messageUuid: string,
    userUuid: string,
    inMemoryAttachments?: EmailAttachmentPayload[],
  ) {
    const message = await this.prisma.emailMessage.findFirst({
      where: { message_uuid: messageUuid, user_uuid: userUuid },
      include: {
        recipients: true,
        attachments: true,
        configuration: {
          include: { provider: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Email message not found');
    }

    await this.prisma.emailMessage.update({
      where: { message_uuid: messageUuid },
      data: { status: MessageSendingStatus.PROCESSING },
    });

    try {
      const { credentials, adapter } =
        await this.providerConfigService.getDecryptedConfiguration(
          userUuid,
          message.configuration_uuid || undefined,
          MessagingChannel.EMAIL,
        );

      const attachmentsToSend: EmailAttachmentPayload[] = inMemoryAttachments && inMemoryAttachments.length > 0
        ? inMemoryAttachments
        : (message.attachments || []).map((att) => ({
            filename: att.filename,
            content_type: att.content_type,
            content_base64: att.content_base64 || '',
          }));

      const payload: SendEmailPayload = {
        sender_name: message.sender_name || 'Antigravity Platform',
        sender_email: message.sender_email,
        reply_to: message.reply_to || undefined,
        recipients: message.recipients.map((r) => ({
          email: r.email,
          name: r.name || undefined,
          type: r.type as any,
        })),
        subject: message.subject,
        html_content: message.html_content,
        text_content: message.text_content || undefined,
        attachments: attachmentsToSend,
        metadata: (message.metadata as Record<string, any>) || {},
      };

      const result = await adapter.sendEmail(credentials, payload);

      if (result.success) {
        const updated = await this.prisma.emailMessage.update({
          where: { message_uuid: messageUuid },
          data: {
            status: MessageSendingStatus.ACCEPTED,
            provider_message_id: result.provider_message_id || null,
            sent_at: new Date(),
            delivered_at: new Date(),
            last_error: null,
          },
          include: { recipients: true },
        });

        await this.prisma.messageRecipient.updateMany({
          where: { message_uuid: messageUuid },
          data: {
            status: MessageSendingStatus.DELIVERED,
            delivered_at: new Date(),
          },
        });

        return {
          success: true,
          status: MessageSendingStatus.ACCEPTED,
          provider_message_id: result.provider_message_id,
          message: updated,
        };
      } else {
        const failed = await this.prisma.emailMessage.update({
          where: { message_uuid: messageUuid },
          data: {
            status: MessageSendingStatus.FAILED,
            last_error: result.error || 'Provider rejected email transmission',
            attempts: { increment: 1 },
          },
          include: { recipients: true },
        });

        await this.prisma.messageRecipient.updateMany({
          where: { message_uuid: messageUuid },
          data: {
            status: MessageSendingStatus.FAILED,
            error_details: result.error,
          },
        });

        return {
          success: false,
          status: MessageSendingStatus.FAILED,
          error: result.error,
          message: failed,
        };
      }
    } catch (err: any) {
      this.logger.error(
        `Error dispatching email message ${messageUuid}: ${err.message}`,
        err.stack,
      );

      const failed = await this.prisma.emailMessage.update({
        where: { message_uuid: messageUuid },
        data: {
          status: MessageSendingStatus.FAILED,
          last_error: err.message,
          attempts: { increment: 1 },
        },
        include: { recipients: true },
      });

      return {
        success: false,
        status: MessageSendingStatus.FAILED,
        error: err.message,
        message: failed,
      };
    }
  }

  async listEmailHistory(
    userUuid: string,
    query: {
      page?: number;
      limit?: number;
      status?: MessageSendingStatus;
      search?: string;
    },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      user_uuid: userUuid,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { subject: { contains: query.search, mode: 'insensitive' } },
              { sender_email: { contains: query.search, mode: 'insensitive' } },
              {
                recipients: {
                  some: {
                    email: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.emailMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          recipients: true,
          attachments: true,
          provider: {
            select: { name: true, slug: true, logo: true },
          },
          configuration: {
            select: { configuration_name: true },
          },
        },
      }),
      this.prisma.emailMessage.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEmailDetails(userUuid: string, messageUuid: string) {
    const message = await this.prisma.emailMessage.findFirst({
      where: { message_uuid: messageUuid, user_uuid: userUuid },
      include: {
        recipients: true,
        attachments: true,
        provider: true,
        configuration: true,
        template: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Email message record not found');
    }

    return message;
  }

  async getMessagingStats(userUuid: string) {
    const [total, delivered, failed, queued, activeConfigs] =
      await Promise.all([
        this.prisma.emailMessage.count({ where: { user_uuid: userUuid } }),
        this.prisma.emailMessage.count({
          where: {
            user_uuid: userUuid,
            status: { in: [MessageSendingStatus.ACCEPTED, MessageSendingStatus.DELIVERED] },
          },
        }),
        this.prisma.emailMessage.count({
          where: { user_uuid: userUuid, status: MessageSendingStatus.FAILED },
        }),
        this.prisma.emailMessage.count({
          where: {
            user_uuid: userUuid,
            status: { in: [MessageSendingStatus.QUEUED, MessageSendingStatus.PROCESSING] },
          },
        }),
        this.prisma.userProviderConfiguration.count({
          where: { user_uuid: userUuid, is_active: true, deleted_at: null },
        }),
      ]);

    const queueStats = await this.queueService.getQueueStats();

    return {
      total,
      delivered,
      failed,
      queued,
      active_configurations: activeConfigs,
      delivery_rate: total > 0 ? Number(((delivered / total) * 100).toFixed(1)) : 100,
      queue: queueStats,
    };
  }
}
