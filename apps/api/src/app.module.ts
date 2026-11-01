import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { ValkeyModule } from './cache/valkey.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // 1. Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // 2. PostgreSQL via Prisma
    PrismaModule,

    // 3. MongoDB via Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri'),
      }),
    }),

    // 4. In-Memory Cache via Valkey (Redis-compatible)
    ValkeyModule,

    // 5. Domain Modules
    AuthModule,
    UsersModule,
    AuditModule,
    HealthModule,
  ],
})
export class AppModule {}

