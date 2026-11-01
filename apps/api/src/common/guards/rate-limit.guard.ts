import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ValkeyService } from '../../cache/valkey.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly valkeyService: ValkeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // 100 requests per minute per IP
    const { allowed, remaining, resetTime } = await this.valkeyService.checkRateLimit(
      `ip:${clientIp}`,
      100,
      60,
    );

    const res = context.switchToHttp().getResponse();
    res.setHeader('X-RateLimit-Limit', 100);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (!allowed) {
      throw new HttpException(
        'Too Many Requests. Rate limit exceeded. Please try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

