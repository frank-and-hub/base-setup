import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '@monorepo/shared-types';
import { redactSensitiveData } from '@monorepo/shared-utils';
import { AuditService } from '../../audit/audit.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly auditService?: AuditService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request.correlationId || (request.headers['x-correlation-id'] as string) || 'unknown';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let errorName: string = 'InternalServerError';

    if (exception instanceof HttpException) {
      errorName = exception.name;
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message = (body.message as string | string[]) || exception.message;
        errorName = (body.error as string) || exception.name;
      } else if (typeof res === 'string') {
        message = res;
      }
    } else if (exception instanceof Error) {
      errorName = exception.name;
      message = exception.message;
      this.logger.error(`[${correlationId}] Unhandled Error at ${request.method} ${request.url}:`, exception.stack);
    }

    // Persist to MongoDB Application Error Logs (Requirement 9.12)
    if (this.auditService && (status >= 400)) {
      const user = (request as any).user;
      const stack = exception instanceof Error ? exception.stack : undefined;

      this.auditService.logApplicationError({
        error_type: errorName,
        message: Array.isArray(message) ? message.join(', ') : message,
        stack,
        module: 'API',
        correlation_id: correlationId,
        status_code: status,
        request_metadata: {
          method: request.method,
          url: request.url,
          ip: request.ip || request.socket.remoteAddress,
          user_agent: request.headers['user-agent'],
          user_uuid: user?.user_uuid,
        },
      }).catch(() => {
        // Safe fail-open for error logging failures
      });
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      statusCode: status,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.setHeader('x-correlation-id', correlationId);
    response.status(status).json(errorPayload);
  }
}
