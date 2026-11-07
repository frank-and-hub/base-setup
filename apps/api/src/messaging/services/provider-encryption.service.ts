import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ProviderEncryptionService {
  private readonly logger = new Logger(ProviderEncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const rawSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'fallback_secret_32_bytes_super_secure_key_1234567890';
    // Derive stable 256-bit key from secret
    this.key = crypto.createHash('sha256').update(rawSecret).digest();
  }

  encrypt(plainObject: Record<string, any>): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    const plaintext = JSON.stringify(plainObject);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Format: iv:authTag:encryptedHex
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  encryptObject(plainObject: Record<string, any>): string {
    return this.encrypt(plainObject);
  }

  decrypt(ciphertext: string): Record<string, any> {
    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (err: any) {
      this.logger.error(`Decryption error: ${err.message}`);
      throw new Error('Failed to decrypt provider credentials');
    }
  }

  decryptObject(ciphertext: string): Record<string, any> {
    return this.decrypt(ciphertext);
  }

  maskSecrets(credentials: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (
        typeof value === 'string' &&
        (key.includes('password') ||
          key.includes('secret') ||
          key.includes('key') ||
          key.includes('token'))
      ) {
        masked[key] = value.length > 8 ? `${value.slice(0, 3)}••••••••${value.slice(-3)}` : '••••••••';
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  maskCredentials(credentials: Record<string, any>): Record<string, any> {
    return this.maskSecrets(credentials);
  }
}
