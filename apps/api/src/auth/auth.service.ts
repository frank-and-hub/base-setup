import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { ValkeyService } from '../cache/valkey.service';
import { AuditService } from '../audit/audit.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponse,
  JwtTokens,
  UserRole,
  UserStatus,
  AuditAction,
} from '@monorepo/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly valkeyService: ValkeyService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, ip?: string, userAgent?: string): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    // Generate Tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role as UserRole, ip, userAgent);

    // Write Audit Log to MongoDB
    await this.auditService.logEvent({
      action: AuditAction.USER_CREATED,
      userId: user.id,
      userEmail: user.email,
      resource: 'User',
      resourceId: user.id,
      details: { role: user.role, status: user.status },
      ipAddress: ip,
      userAgent,
      timestamp: new Date(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        status: user.status as UserStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Your account is inactive or suspended');
    }

    // Generate tokens and store refresh token
    const tokens = await this.generateTokens(user.id, user.email, user.role as UserRole, ip, userAgent);

    // Record login event in MongoDB
    await this.auditService.logEvent({
      action: AuditAction.USER_LOGIN,
      userId: user.id,
      userEmail: user.email,
      resource: 'Auth',
      ipAddress: ip,
      userAgent,
      timestamp: new Date(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        status: user.status as UserStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string, ip?: string, userAgent?: string): Promise<JwtTokens> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    let payload: { sub: string; email: string; role: UserRole };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Hash token to compare with stored hash
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has been revoked or expired');
    }

    // Revoke the old refresh token (Token Rotation!)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generate new pair
    const newTokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role as UserRole,
      ip,
      userAgent,
    );

    // Record audit event in MongoDB
    await this.auditService.logEvent({
      action: AuditAction.TOKEN_REFRESH,
      userId: storedToken.user.id,
      userEmail: storedToken.user.email,
      resource: 'Auth',
      ipAddress: ip,
      userAgent,
      timestamp: new Date(),
    });

    return newTokens;
  }

  async logout(userId: string, tokenId?: string, refreshToken?: string): Promise<void> {
    // 1. Blacklist the short-lived access token in Valkey for instant revocation
    if (tokenId) {
      await this.valkeyService.blacklistToken(tokenId, 900); // 15 min TTL
    }

    // 2. Revoke the refresh token in PostgreSQL if supplied
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }

    // 3. Audit log in MongoDB
    await this.auditService.logEvent({
      action: AuditAction.USER_LOGOUT,
      userId,
      resource: 'Auth',
      timestamp: new Date(),
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
    ip?: string,
    userAgent?: string,
  ): Promise<JwtTokens> {
    const tokenId = crypto.randomUUID();

    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn', '15m');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');

    const accessToken = this.jwtService.sign(
      { sub: userId, email, role, tokenId },
      { secret: accessSecret, expiresIn: accessExpiresIn },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, email, role, tokenId: crypto.randomUUID() },
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );

    // Store hashed refresh token in PostgreSQL with 7 days expiry
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
        ipAddress: ip,
        userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

