export interface AuditLog {
  audit_log_uuid: string;
  auditLogUuid?: string;
  actor_uuid: string | null;
  actorUuid?: string | null;
  actor_email?: string | null;
  actorEmail?: string | null;
  action: string;
  resource_type: string;
  resourceType?: string;
  affected_resource_uuid?: string | null;
  affectedResourceUuid?: string | null;
  timestamp: string | Date;
  correlation_id: string;
  correlationId?: string;
  outcome: 'SUCCESS' | 'FAILURE';
  before_state?: Record<string, unknown> | null;
  beforeState?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ip_address?: string | null;
  ipAddress?: string | null;
  user_agent?: string | null;
  userAgent?: string | null;
}

export interface UserActivityLog {
  activity_log_uuid: string;
  activityLogUuid?: string;
  user_uuid: string | null;
  userUuid?: string | null;
  actor_uuid: string | null;
  actorUuid?: string | null;
  action: string;
  timestamp: string | Date;
  correlation_id: string;
  correlationId?: string;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  ipAddress?: string | null;
  user_agent?: string | null;
  userAgent?: string | null;
}

export interface AppErrorLog {
  error_log_uuid: string;
  errorLogUuid?: string;
  timestamp: string | Date;
  error_type: string;
  errorType?: string;
  message: string;
  stack?: string | null;
  module: string;
  environment: string;
  correlation_id: string;
  correlationId?: string;
  status_code: number;
  statusCode?: number;
  request_metadata?: {
    method?: string;
    url?: string;
    ip?: string;
    user_agent?: string;
    user_uuid?: string;
  } | null;
  requestMetadata?: {
    method?: string;
    url?: string;
    ip?: string;
    userAgent?: string;
    userUuid?: string;
  } | null;
}
