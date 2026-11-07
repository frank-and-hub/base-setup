import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateTemplateDto {
  name: string;
  description?: string;
  subject: string;
  html_content: string;
  text_content?: string;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  is_active?: boolean;
}

@Injectable()
export class EmailTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async listTemplates(userUuid: string, search?: string) {
    return this.prisma.emailTemplate.findMany({
      where: {
        deleted_at: null,
        user_uuid: userUuid,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getTemplate(userUuid: string, templateUuid: string) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: {
        template_uuid: templateUuid,
        deleted_at: null,
        user_uuid: userUuid,
      },
    });

    if (!template) {
      throw new NotFoundException(`Email template not found`);
    }

    return template;
  }

  async createTemplate(userUuid: string, dto: CreateTemplateDto) {
    const variables = this.extractVariables(
      `${dto.subject} ${dto.html_content} ${dto.text_content || ''}`,
    );

    return this.prisma.emailTemplate.create({
      data: {
        user_uuid: userUuid,
        name: dto.name,
        description: dto.description || null,
        subject: dto.subject,
        html_content: dto.html_content,
        text_content: dto.text_content || null,
        variables,
        is_active: true,
      },
    });
  }

  async updateTemplate(userUuid: string, templateUuid: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: {
        template_uuid: templateUuid,
        user_uuid: userUuid,
        deleted_at: null,
      },
    });

    if (!template) {
      throw new NotFoundException(`Template not found`);
    }

    const subject = dto.subject ?? template.subject;
    const htmlContent = dto.html_content ?? template.html_content;
    const textContent = dto.text_content ?? template.text_content ?? '';

    const variables = this.extractVariables(`${subject} ${htmlContent} ${textContent}`);

    return this.prisma.emailTemplate.update({
      where: { template_uuid: templateUuid },
      data: {
        name: dto.name ?? template.name,
        description: dto.description ?? template.description,
        subject,
        html_content: htmlContent,
        text_content: dto.text_content ?? template.text_content,
        variables,
        is_active: dto.is_active ?? template.is_active,
      },
    });
  }

  async duplicateTemplate(userUuid: string, templateUuid: string) {
    const source = await this.getTemplate(userUuid, templateUuid);
    const newName = `${source.name} (Copy)`;

    return this.prisma.emailTemplate.create({
      data: {
        user_uuid: userUuid,
        name: newName,
        description: source.description,
        subject: source.subject,
        html_content: source.html_content,
        text_content: source.text_content,
        variables: source.variables,
        is_active: true,
      },
    });
  }

  async deleteTemplate(userUuid: string, templateUuid: string) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: {
        template_uuid: templateUuid,
        user_uuid: userUuid,
        deleted_at: null,
      },
    });

    if (!template) {
      throw new NotFoundException(`Template not found`);
    }

    await this.prisma.emailTemplate.update({
      where: { template_uuid: templateUuid },
      data: { deleted_at: new Date(), is_active: false },
    });

    return { success: true, message: 'Email template deleted successfully' };
  }

  // Parses handlebars/bracket syntax {{variable_name}}
  extractVariables(content: string): string[] {
    const matches = content.match(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g);
    if (!matches) return [];
    const set = new Set<string>();
    for (const m of matches) {
      const clean = m.replace(/[\{\}\s]/g, '');
      if (clean) set.add(clean);
    }
    return Array.from(set);
  }

  // Replaces {{variable}} in text
  renderContent(templateStr: string, variables: Record<string, any> = {}): string {
    if (!templateStr) return '';
    return templateStr.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key) => {
      return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
    });
  }
}
