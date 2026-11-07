import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { ValkeyModule } from './cache/valkey.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { NavigationModule } from './navigation/navigation.module';
import { AuditModule } from './audit/audit.module';
import { ActivityModule } from './activity/activity.module';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';
import { GraphifyModule } from './graphify/graphify.module';
import { MessagingModule } from './messaging/messaging.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    PrismaModule,

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri'),
      }),
    }),

    ValkeyModule,

    AuthModule,
    UsersModule,
    RolesModule,
    NavigationModule,
    AuditModule,
    ActivityModule,
    SettingsModule,
    HealthModule,
    GraphifyModule,
    MessagingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
