import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('User Activity Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('activity-logs')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @RequirePermissions('users.view_activity')
  @ApiOperation({ summary: 'List user activity logs with pagination and filters' })
  async findAll(@Query() query: any) {
    return this.activityService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user personal activity log' })
  async getMyActivity(@CurrentUser('user_uuid') userUuid: string) {
    return this.activityService.findByUser(userUuid, 30);
  }

  @Get('user/:user_uuid')
  @RequirePermissions('users.view_activity')
  @ApiOperation({ summary: 'Get activity history for specific user' })
  async getUserActivity(@Param('user_uuid') userUuid: string) {
    return this.activityService.findByUser(userUuid, 50);
  }
}

