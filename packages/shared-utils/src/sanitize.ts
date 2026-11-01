const SENSITIVE_KEY_EXACT = new Set([
  'password',
  'passwordhash',
  'secret',
  'clientsecret',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'bearertoken',
  'authorization',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'apikey',
  'privatekey',
]);

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  if (SENSITIVE_KEY_EXACT.has(normalized)) return true;
  if (normalized.endsWith('password') || normalized.endsWith('secret') || normalized.endsWith('token')) {
    return true;
  }
  return false;
}

export function redactSensitiveData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const copy: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (isSensitiveKey(key) && (typeof val !== 'object' || val === null)) {
        copy[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        copy[key] = redactSensitiveData(val);
      } else if (isSensitiveKey(key)) {
        copy[key] = '[REDACTED]';
      } else {
        copy[key] = val;
      }
    }
    return copy as T;
  }

  return obj;
}
