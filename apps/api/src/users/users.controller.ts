import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto, UpdateUserDto, UserQueryDto, UserRole } from '@monorepo/shared-types';

@ApiTags('Users Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('dashboard/metrics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Retrieve system overview statistics for Admin Dashboard' })
  async getDashboardMetrics() {
    return this.usersService.getDashboardMetrics();
  }

  @Get('profile/me')
  @ApiOperation({ summary: 'Get current user personal profile details' })
  async getMyProfile(@CurrentUser('user_uuid') userUuid: string) {
    return this.usersService.findById(userUuid);
  }

  @Patch('profile/me')
  @ApiOperation({ summary: 'Update current user personal profile fields' })
  async updateMyProfile(
    @CurrentUser('user_uuid') userUuid: string,
    @Body() dto: UpdateUserDto,
  ) {
    const safeDto: UpdateUserDto = {
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone_number: dto.phone_number,
      address: dto.address,
      profile_picture_url: dto.profile_picture_url,
    };
    return this.usersService.update(userUuid, safeDto, userUuid);
  }

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List users with pagination, sorting, search, and filtering' })
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':user_uuid')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Get single user by UUID' })
  async findOne(@Param('user_uuid') userUuid: string) {
    return this.usersService.findById(userUuid);
  }

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Create a new user account (Admin clearance required)' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser('user_uuid') actorUuid: string,
    @CurrentUser('role') actorRole: UserRole,
  ) {
    return this.usersService.create(dto, actorUuid, actorRole);
  }

  @Patch(':user_uuid')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Update user profile, status, or role' })
  async update(
    @Param('user_uuid') userUuid: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('user_uuid') actorUuid: string,
    @CurrentUser('role') actorRole: UserRole,
  ) {
    return this.usersService.update(userUuid, dto, actorUuid, actorRole);
  }

  @Delete(':user_uuid')
  @RequirePermissions('users.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user and cascade sessions (Super Admin / Admin)' })
  async remove(
    @Param('user_uuid') userUuid: string,
    @CurrentUser('user_uuid') actorUuid: string,
    @CurrentUser('role') actorRole: UserRole,
  ) {
    return this.usersService.remove(userUuid, actorUuid, actorRole);
  }
}
