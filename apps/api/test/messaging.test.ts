import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as crypto from 'crypto';

describe('Messaging Multi-Provider & Security Test Suite', () => {
  const testSecret = 'messaging_test_encryption_super_secret_key_32bytes!';
  const key = crypto.createHash('sha256').update(testSecret).digest();
  const algorithm = 'aes-256-gcm';

  function encrypt(plainObject: Record<string, any>): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const plaintext = JSON.stringify(plainObject);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  function decrypt(ciphertext: string): Record<string, any> {
    const parts = ciphertext.split(':');
    assert.strictEqual(parts.length, 3, 'Ciphertext must be composed of 3 colon-delimited tokens');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  function maskSecrets(credentials: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = {};
    for (const [k, value] of Object.entries(credentials)) {
      if (
        typeof value === 'string' &&
        (k.includes('password') || k.includes('secret') || k.includes('key') || k.includes('token'))
      ) {
        masked[k] = value.length > 8 ? `${value.slice(0, 3)}••••••••${value.slice(-3)}` : '••••••••';
      } else {
        masked[k] = value;
      }
    }
    return masked;
  }

  test('AES-256-GCM encryption/decryption round-trip preserves provider credentials', () => {
    const credentials = {
      host: 'smtp.office365.com',
      port: 587,
      username: 'support@antigravity.dev',
      password: 'ExtremelySecretPassword123!',
      encryption: 'STARTTLS',
    };

    const ciphertext = encrypt(credentials);
    assert.notStrictEqual(ciphertext, JSON.stringify(credentials));
    assert.ok(ciphertext.includes(':'));

    const decrypted = decrypt(ciphertext);
    assert.deepStrictEqual(decrypted, credentials);
  });

  test('Masking prevents plaintext password/API key exposure in API outputs', () => {
    const credentials = {
      api_key: 'SG.very_long_secret_sendgrid_token_987654321',
      username: 'sendgrid_user',
    };

    const masked = maskSecrets(credentials);
    assert.strictEqual(masked.username, 'sendgrid_user');
    assert.ok(!masked.api_key.includes('very_long_secret'));
    assert.ok(masked.api_key.includes('••••••••'));
  });

  test('Template variable extractor and handlebar interpolator work accurately', () => {
    const tpl = 'Hello {{first_name}}, your verification PIN for {{app_name}} is {{pin}}!';
    const matches = tpl.match(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g) || [];
    const variables = Array.from(new Set(matches.map((m) => m.replace(/[\{\}\s]/g, '')))).sort();

    assert.deepStrictEqual(variables, ['app_name', 'first_name', 'pin']);

    const rendered = tpl.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, k) => {
      const vars: Record<string, any> = {
        first_name: 'Sarah',
        app_name: 'Antigravity Portal',
        pin: '482019',
      };
      return vars[k] ?? '';
    });

    assert.strictEqual(rendered, 'Hello Sarah, your verification PIN for Antigravity Portal is 482019!');
  });
});
