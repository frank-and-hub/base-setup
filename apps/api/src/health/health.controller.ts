import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PrismaService } from '../database/prisma.service';
import { ValkeyService } from '../cache/valkey.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly valkeyService: ValkeyService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check status of API, PostgreSQL, MongoDB, and Valkey' })
  async checkHealth() {
    const start = Date.now();
    const checks: Record<string, { status: 'healthy' | 'unhealthy'; latencyMs?: number; error?: string }> = {};

    // 1. PostgreSQL check
    try {
      const pgStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.postgres = { status: 'healthy', latencyMs: Date.now() - pgStart };
    } catch (err: any) {
      checks.postgres = { status: 'unhealthy', error: err?.message || String(err) };
    }

    // 2. MongoDB check
    try {
      const isMongoReady = this.mongoConnection.readyState === 1;
      checks.mongodb = {
        status: isMongoReady ? 'healthy' : 'unhealthy',
        error: isMongoReady ? undefined : `MongoDB state is ${this.mongoConnection.readyState}`,
      };
    } catch (err: any) {
      checks.mongodb = { status: 'unhealthy', error: err?.message || String(err) };
    }

    // 3. Valkey check
    try {
      const valkeyStart = Date.now();
      const pingResponse = await this.valkeyService.ping();
      checks.valkey = {
        status: pingResponse === 'PONG' ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - valkeyStart,
      };
    } catch (err: any) {
      checks.valkey = { status: 'unhealthy', error: err?.message || String(err) };
    }

    const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      totalLatencyMs: Date.now() - start,
      services: checks,
    };
  }
}
