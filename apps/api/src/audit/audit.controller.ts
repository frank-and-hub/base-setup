import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@monorepo/shared-types';

@ApiTags('Audit Logs (MongoDB)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: 'Get recent document-oriented audit logs from MongoDB' })
  @Get()
  async getRecentLogs(
    @Query('limit') limit = 50,
    @Query('action') action?: string,
  ) {
    return this.auditService.getRecentLogs(Number(limit) || 50, action);
  }
}

