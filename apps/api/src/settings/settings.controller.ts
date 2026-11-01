import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Default Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public application branding and configurations' })
  async getPublicSettings() {
    return this.settingsService.getAll(false);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Get()
  @RequirePermissions('settings.manage')
  @ApiOperation({ summary: 'Get all system settings (Admin only)' })
  async getAllSettings() {
    return this.settingsService.getAll(true);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Patch(':key')
  @RequirePermissions('settings.manage')
  @ApiOperation({ summary: 'Update system setting value' })
  async updateSetting(
    @Param('key') key: string,
    @Body('value') value: string,
    @CurrentUser('user_uuid') actorUuid: string,
  ) {
    return this.settingsService.update(key, String(value), actorUuid);
  }
}

