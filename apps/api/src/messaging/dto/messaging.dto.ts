import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConfigurationDto {
  @ApiProperty({ description: 'Slug or UUID of the global provider, e.g. smtp, sendgrid' })
  @IsString()
  @IsNotEmpty()
  provider_slug: string;

  @ApiProperty({ description: 'Friendly name for this configuration' })
  @IsString()
  @IsNotEmpty()
  configuration_name: string;

  @ApiProperty({ description: 'Key-value map of configuration credentials' })
  @IsObject()
  @IsNotEmpty()
  credentials: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sender display name' })
  @IsString()
  @IsOptional()
  sender_name?: string;

  @ApiPropertyOptional({ description: 'Sender email address' })
  @IsEmail()
  @IsOptional()
  sender_email?: string;

  @ApiPropertyOptional({ description: 'Reply-to email address' })
  @IsEmail()
  @IsOptional()
  reply_to?: string;

  @ApiPropertyOptional({ description: 'Set as default configuration for this channel' })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}

export class UpdateConfigurationDto {
  @ApiPropertyOptional({ description: 'Friendly name for this configuration' })
  @IsString()
  @IsOptional()
  configuration_name?: string;

  @ApiPropertyOptional({ description: 'Updated credentials' })
  @IsObject()
  @IsOptional()
  credentials?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sender display name' })
  @IsString()
  @IsOptional()
  sender_name?: string;

  @ApiPropertyOptional({ description: 'Sender email address' })
  @IsEmail()
  @IsOptional()
  sender_email?: string;

  @ApiPropertyOptional({ description: 'Reply-to email address' })
  @IsEmail()
  @IsOptional()
  reply_to?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Default configuration flag' })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}

export class TestAdHocConfigurationDto {
  @ApiProperty({ description: 'Provider slug or UUID' })
  @IsString()
  @IsNotEmpty()
  provider_slug: string;

  @ApiProperty({ description: 'Credentials object to test without saving' })
  @IsObject()
  @IsNotEmpty()
  credentials: Record<string, any>;
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Name of the template' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Subject line with optional {{variables}}' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'HTML content with optional {{variables}}' })
  @IsString()
  @IsNotEmpty()
  html_content: string;

  @ApiPropertyOptional({ description: 'Plain-text fallback body' })
  @IsString()
  @IsOptional()
  text_content?: string;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  html_content?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  text_content?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class RecipientDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Recipient name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ['TO', 'CC', 'BCC'], default: 'TO' })
  @IsString()
  @IsOptional()
  type?: 'TO' | 'CC' | 'BCC';
}

export class AttachmentDto {
  @ApiProperty({ description: 'File name with extension' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  @IsNotEmpty()
  content_type: string;

  @ApiProperty({ description: 'Base64 encoded file data' })
  @IsString()
  @IsNotEmpty()
  content_base64: string;
}

export class SendEmailRequestDto {
  @ApiPropertyOptional({ description: 'UUID of specific UserProviderConfiguration to send through' })
  @IsString()
  @IsOptional()
  provider_configuration_uuid?: string;

  @ApiPropertyOptional({ description: 'UUID of email template to use' })
  @IsString()
  @IsOptional()
  template_uuid?: string;

  @ApiPropertyOptional({ description: 'Key-value dictionary of variables to inject' })
  @IsObject()
  @IsOptional()
  template_variables?: Record<string, any>;

  @ApiProperty({ type: [RecipientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];

  @ApiProperty({ description: 'Subject line' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({ description: 'HTML content' })
  @IsString()
  @IsOptional()
  html_content?: string;

  @ApiPropertyOptional({ description: 'Plain text content' })
  @IsString()
  @IsOptional()
  text_content?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sender_name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  sender_email?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  reply_to?: string;

  @ApiPropertyOptional({ type: [AttachmentDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({ description: 'Send asynchronously via Valkey queue' })
  @IsBoolean()
  @IsOptional()
  send_async?: boolean;

  @ApiPropertyOptional({ description: 'Scheduled delivery ISO timestamp' })
  @IsString()
  @IsOptional()
  scheduled_at?: string;

  @ApiPropertyOptional({ description: 'Metadata for tracking and tags' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
