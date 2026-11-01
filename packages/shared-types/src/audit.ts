export enum AuditAction {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
}

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string | Date;
}

