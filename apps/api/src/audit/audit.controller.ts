import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Audit & Error Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('audit-logs')
  @RequirePermissions('audit_logs.read')
  @ApiOperation({ summary: 'List structured PostgreSQL audit logs' })
  async getAuditLogs(@Query() query: any) {
    return this.auditService.findAuditLogs(query);
  }

  @Get('error-logs')
  @RequirePermissions('error_logs.read')
  @ApiOperation({ summary: 'List MongoDB application error logs with stack traces' })
  async getErrorLogs(@Query() query: any) {
    return this.auditService.findErrorLogs(query);
  }
}
