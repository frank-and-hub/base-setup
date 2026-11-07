export interface EmailRecipient {
  email: string;
  name?: string;
  type?: 'TO' | 'CC' | 'BCC';
}

export interface EmailAttachmentPayload {
  filename: string;
  content_type: string;
  content_base64: string; // Base64 encoded file data
}

export interface SendEmailPayload {
  sender_name: string;
  sender_email: string;
  reply_to?: string;
  recipients: EmailRecipient[];
  subject: string;
  html_content: string;
  text_content?: string;
  attachments?: EmailAttachmentPayload[];
  metadata?: Record<string, any>;
}

export interface SendEmailResult {
  success: boolean;
  provider_message_id?: string;
  error?: string;
  raw_response?: any;
}

export interface ProviderCapability {
  supports_html: boolean;
  supports_attachments: boolean;
  supports_template_variables: boolean;
  supports_cc_bcc: boolean;
  supports_delivery_tracking: boolean;
  supports_open_tracking: boolean;
  supports_click_tracking: boolean;
}

export interface EmailProviderInterface {
  readonly slug: string;
  validateConfiguration(credentials: Record<string, any>): Promise<{ valid: boolean; error?: string }>;
  testConnection(credentials: Record<string, any>): Promise<{ success: boolean; message: string }>;
  sendEmail(credentials: Record<string, any>, payload: SendEmailPayload): Promise<SendEmailResult>;
  getCapabilities(): ProviderCapability;
}
